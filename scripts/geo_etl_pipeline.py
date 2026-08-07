#!/usr/bin/env python3
"""
============================================================================
LandMap GEO ETL Pipeline — Ingest + Process + Generate Tiles
============================================================================
Processa datasets públicos do Brasil (INCRA SIGEF + IBGE + Sentinel-2 + DEM)
e gera vector tiles (.pbf) + COG imagery para visualização web.

Uso:
    python geo_etl_pipeline.py --state MG --phase 1

Fases:
    1 = Ingest + Process (glebas + limites + DEM)
    2 = Imagery (Sentinel-2/CBERS batch)
    3 = Tile generation (tippecanoe)
    4 = Upload to S3 + CDN invalidation
============================================================================
"""

import os
import sys
import json
import argparse
import logging
import subprocess
from pathlib import Path
from datetime import datetime
import tempfile
import hashlib

import geopandas as gpd
import rasterio
from rasterio.io import MemoryFile
from rasterio.merge import merge
from rasterio.mask import mask
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.vrt import WarpedVRT
import numpy as np
import psycopg2
from psycopg2.extras import execute_values
import requests
from osgeo import gdal, ogr, gdalconst

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DATASET_DIR = Path('./data/brazil-datasets')
TEMP_DIR = Path(tempfile.gettempdir()) / 'landmap-geo'
OUTPUT_DIR = Path('./data/geo-output')
S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'landmap-geo-prod')
DB_DSN = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost/landmap')

# State boundaries (for data filtering)
STATES = {
    'MG': {'bbox': [-49, -22.5, -40, -14.8], 'code': 31},
    'SP': {'bbox': [-49.5, -25.5, -44, -19], 'code': 35},
    'RJ': {'bbox': [-48.5, -23.5, -40.5, -20], 'code': 33},
    'BA': {'bbox': [-48.5, -18.5, -37, -9], 'code': 29},
    'RS': {'bbox': [-57.5, -33.5, -49.5, -26.5], 'code': 43},
}

# ============================================================================
# 1. DATA INGESTION — Download datasets públicos
# ============================================================================

class DataIngestion:
    """Baixa e valida datasets públicos do Brasil"""

    @staticmethod
    def download_incra_sigef(state: str) -> Path:
        """Download INCRA SIGEF glebas via WFS OGC"""
        logger.info(f'Downloading INCRA SIGEF for {state}...')

        state_code = STATES[state]['code']
        output_file = TEMP_DIR / f'incra_sigef_{state}.geojson'

        # WFS request para glebas federais
        wfs_url = (
            'https://sigef.incra.gov.br/geoserver/wfs'
            f'?service=WFS&version=2.0.0&request=GetFeature'
            f'&typeName=glebas:glebas'
            f'&CQL_FILTER=uf=\'{state}\''
            f'&outputFormat=application/json'
            f'&maxFeatures=10000'
        )

        try:
            resp = requests.get(wfs_url, timeout=60)
            resp.raise_for_status()

            with open(output_file, 'w') as f:
                f.write(resp.text)

            logger.info(f'✓ INCRA SIGEF {state}: {output_file.stat().st_size / 1024:.1f} KB')
            return output_file
        except Exception as e:
            logger.error(f'✗ INCRA SIGEF download failed: {e}')
            return None

    @staticmethod
    def download_ibge_municipios() -> Path:
        """Download IBGE limites municipais 2023"""
        logger.info('Downloading IBGE municipios 2023...')

        output_zip = TEMP_DIR / 'mun_2023.zip'
        output_shp = TEMP_DIR / 'mun_2023.shp'

        # Verificar se já existe
        if output_shp.exists():
            logger.info(f'✓ IBGE municipios (cached): {output_shp}')
            return output_shp

        ftp_url = 'ftp://geoftp.ibge.gov.br/organizacao_territorial/malhas_territoriais/malhas_municipais/municipios_2023/BR_Municipios_2023.zip'

        try:
            # Download (pode ser lento)
            subprocess.run([
                'curl', '-L', '-o', str(output_zip), ftp_url
            ], check=True, timeout=300)

            # Unzip
            subprocess.run(['unzip', '-o', str(output_zip), '-d', str(TEMP_DIR)], check=True)

            logger.info(f'✓ IBGE municipios: {output_zip.stat().st_size / 1024 / 1024:.1f} MB')
            return output_shp
        except Exception as e:
            logger.error(f'✗ IBGE download failed: {e}')
            return None

    @staticmethod
    def download_copernicus_dem(state: str) -> list[Path]:
        """Download Copernicus DEM 30m tiles para state"""
        logger.info(f'Downloading Copernicus DEM 30m for {state}...')

        bbox = STATES[state]['bbox']
        min_lon, min_lat, max_lon, max_lat = bbox

        # Calcular tiles N/E cobertos
        tiles = []
        for lat in range(int(min_lat) - 1, int(max_lat) + 2):
            for lon in range(int(min_lon) - 1, int(max_lon) + 2):
                tile_name = f'N{abs(lat):02d}E{lon:03d}' if lat >= 0 else f'S{abs(lat):02d}E{lon:03d}'
                tiles.append(tile_name)

        output_files = []

        # Tentar download de cada tile (alguns podem não existir)
        for tile in tiles:
            try:
                output_file = TEMP_DIR / f'{tile}_dem_30m.tif'

                if output_file.exists():
                    output_files.append(output_file)
                    continue

                # Tentar Copernicus CloudEO
                url = f'https://cloud.sdsc.edu/v1/AUTH_opentopography/Raster/SRTM_GL30/SRTM_GL30_Ellip/SRTM_GL30_Ellip_srtm_{tile}_dem.tif'

                resp = requests.get(url, timeout=60, stream=True)
                if resp.status_code == 200:
                    with open(output_file, 'wb') as f:
                        for chunk in resp.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)

                    output_files.append(output_file)
                    logger.debug(f'  ✓ {tile}')
            except Exception as e:
                logger.debug(f'  ✗ {tile}: {e}')
                continue

        logger.info(f'✓ Copernicus DEM: {len(output_files)} tiles for {state}')
        return output_files

    @staticmethod
    def download_sentinel2_cbers(state: str, max_cloud_cover: int = 30) -> list[Path]:
        """Download Sentinel-2 L2A ou CBERS-4A (mais recente com <cloud_cover)"""
        logger.info(f'Downloading Sentinel-2/CBERS for {state} (cloud cover <{max_cloud_cover}%)...')

        bbox = STATES[state]['bbox']
        output_files = []

        # Usar Python STAC client para Brasil Data Cube (CBERS)
        try:
            from pystac_client import Client

            catalog = Client.open('https://brazildatacube.org/api/v1')

            # Search CBERS-4A (melhor que Sentinel-2 para Brasil por resolução)
            search = catalog.search(
                collections=['CBERS-4A'],
                bbox=bbox,
                sortby=[{'field': 'created', 'direction': 'desc'}],
                max_items=3  # Últimas 3 cenas
            )

            for item in search.get_items():
                scene_date = item.properties.get('start_datetime', 'unknown')
                scene_id = item.id

                logger.info(f'  Scene: {scene_id} ({scene_date})')

                # Download B4 (multispectral RGB 8m)
                try:
                    for band in ['B4']:  # RGB combinado
                        asset = item.assets.get(band)
                        if asset:
                            url = asset.href
                            output_file = TEMP_DIR / f'cbers_{scene_id}_{band}.tif'

                            resp = requests.get(url, timeout=120, stream=True)
                            with open(output_file, 'wb') as f:
                                for chunk in resp.iter_content(chunk_size=8192):
                                    if chunk:
                                        f.write(chunk)

                            output_files.append(output_file)
                            logger.debug(f'    ✓ {band}')
                except Exception as e:
                    logger.debug(f'    ✗ Band error: {e}')
                    continue
        except ImportError:
            logger.warning('pystac_client not installed, skipping CBERS download')

        logger.info(f'✓ CBERS/Sentinel-2: {len(output_files)} scenes')
        return output_files

# ============================================================================
# 2. DATA PROCESSING — Validar, clipar, reproject
# ============================================================================

class DataProcessing:
    """Processa datasets brutos para formato GIS padrão"""

    @staticmethod
    def process_vector_data(shapefiles: list[Path], state: str) -> Path:
        """Validar + clipar shapefiles para state bbox"""
        logger.info(f'Processing vector data for {state}...')

        bbox = STATES[state]['bbox']
        min_lon, min_lat, max_lon, max_lat = bbox

        all_geoms = []

        for shp in shapefiles:
            if not shp.exists():
                logger.warning(f'  File not found: {shp}')
                continue

            try:
                gdf = gpd.read_file(shp)

                # Verificar CRS
                if gdf.crs is None:
                    gdf.set_crs('EPSG:4326', inplace=True)
                elif gdf.crs != 'EPSG:4326':
                    gdf = gdf.to_crs('EPSG:4326')

                # Clipar para bbox
                bbox_geom = gpd.points_from_xy([min_lon, max_lon], [min_lat, max_lat])
                from shapely.geometry import box
                bbox_box = box(min_lon, min_lat, max_lon, max_lat)

                gdf_clipped = gdf[gdf.geometry.intersects(bbox_box)]

                if len(gdf_clipped) > 0:
                    all_geoms.append(gdf_clipped)
                    logger.info(f'  ✓ {shp.name}: {len(gdf_clipped)} features')
                else:
                    logger.warning(f'  No features in bbox: {shp.name}')

            except Exception as e:
                logger.error(f'  ✗ Error processing {shp.name}: {e}')
                continue

        if not all_geoms:
            logger.error('No valid vector data after processing!')
            return None

        # Merge all
        merged = gpd.GeoDataFrame(
            pd.concat(all_geoms, ignore_index=True),
            crs='EPSG:4326'
        )

        output_file = OUTPUT_DIR / f'terrenos_processed_{state}.geojson'
        merged.to_file(output_file, driver='GeoJSON')

        logger.info(f'✓ Processed vectors: {len(merged)} features → {output_file}')
        return output_file

    @staticmethod
    def process_raster_dem(dem_tiles: list[Path], state: str) -> Path:
        """Mosaico + clipar DEM para state bbox"""
        logger.info(f'Processing DEM for {state}...')

        bbox = STATES[state]['bbox']
        min_lon, min_lat, max_lon, max_lat = bbox

        if not dem_tiles or len(dem_tiles) == 0:
            logger.error('No DEM tiles provided')
            return None

        # Ler todos os tiles
        src_files = []
        for tile_path in dem_tiles:
            try:
                src_files.append(rasterio.open(tile_path))
            except Exception as e:
                logger.debug(f'  Skipping {tile_path}: {e}')

        if not src_files:
            logger.error('No valid DEM tiles')
            return None

        try:
            # Mosaico
            mosaic, out_trans = merge(src_files)

            # Metadata
            out_meta = src_files[0].meta.copy()
            out_meta.update({
                'height': mosaic.shape[1],
                'width': mosaic.shape[2],
                'transform': out_trans,
                'dtype': rasterio.uint16,
                'compress': 'deflate',
                'tiled': True,
                'blockxsize': 512,
                'blockysize': 512,
            })

            output_file = OUTPUT_DIR / f'dem_30m_{state}_mosaic.tif'

            with rasterio.open(output_file, 'w', **out_meta) as dst:
                dst.write(mosaic)

            logger.info(f'✓ DEM mosaic: {output_file}')
            return output_file

        finally:
            for src in src_files:
                src.close()

# ============================================================================
# 3. DATABASE INGESTION — Inserir em PostgreSQL + PostGIS
# ============================================================================

class DatabaseIngest:
    """Carrega dados processados para PostgreSQL + PostGIS"""

    @staticmethod
    def insert_terrenos(geojson_file: Path, state: str):
        """Inserir geometrias de terrenos no PostgreSQL"""
        logger.info(f'Inserting terrenos into database from {geojson_file}...')

        try:
            conn = psycopg2.connect(DB_DSN)
            cur = conn.cursor()

            gdf = gpd.read_file(geojson_file)

            # Prepare rows
            rows = []
            for idx, row in gdf.iterrows():
                geom_wkt = row.geometry.wkt

                rows.append((
                    None,  # id (UUID será gerado)
                    row.get('incra_id', None),
                    row.get('name', f'Terreno_{idx}'),
                    state,
                    row.get('municipality_code', None),
                    geom_wkt,
                    'INCRA' if 'incra' in row.get('source', '').lower() else 'OTHER',
                    False,  # verified
                ))

            # Bulk insert (usando SQL ST_GeomFromText)
            sql = """
            INSERT INTO terrenos (
              incra_id, name, state_code, municipality_code, geometry,
              data_source, verified
            ) VALUES %s
            ON CONFLICT DO NOTHING
            """

            # Converter para EWKT (com SRID)
            values_sql = [
                f"(%s, %s, %s, %s, ST_GeomFromText(%s, 4326), %s, %s)"
                for _ in rows
            ]

            sql_final = sql.replace('%s', values_sql[0], 1)
            for i in range(1, len(values_sql)):
                sql_final = sql_final.replace('%s', values_sql[i], 1)

            cur.executemany(sql, rows)
            conn.commit()

            logger.info(f'✓ Inserted {cur.rowcount} terrenos for {state}')
            cur.close()
            conn.close()

        except Exception as e:
            logger.error(f'✗ Database insert failed: {e}')

    @staticmethod
    def insert_metrics(dem_file: Path, state: str):
        """Calcular + inserir métricas de terreno (altitude, slope, NDVI, etc)"""
        logger.info(f'Calculating metrics from {dem_file}...')

        try:
            conn = psycopg2.connect(DB_DSN)
            cur = conn.cursor()

            # Abrir DEM
            with rasterio.open(dem_file) as dem:
                dem_data = dem.read(1)  # Band 1 (elevation)

                # Calcular slope usando numpy
                x, y = np.gradient(dem_data)
                slope = np.sqrt(x**2 + y**2) * 100  # % slope

                # Calcular aspect
                aspect = np.arctan2(-x, y) * 180 / np.pi
                aspect = (aspect + 180) % 360

                # Para cada terreno, amostrar centroide
                cur.execute('SELECT id, ST_X(centroid), ST_Y(centroid) FROM terrenos WHERE state_code = %s', (state,))

                for terreno_id, lon, lat in cur.fetchall():
                    # Converter coordenadas para índice de pixel
                    try:
                        row, col = dem.index(lon, lat)
                        if 0 <= row < dem_data.shape[0] and 0 <= col < dem_data.shape[1]:
                            altitude = int(dem_data[row, col])
                            slope_val = float(slope[row, col])
                            aspect_val = int(aspect[row, col])

                            # Insert metrics
                            cur.execute("""
                            INSERT INTO terreno_metrics (terreno_id, altitude_m, slope_percent, aspect_degrees)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (terreno_id) DO UPDATE SET
                              altitude_m = EXCLUDED.altitude_m,
                              slope_percent = EXCLUDED.slope_percent,
                              aspect_degrees = EXCLUDED.aspect_degrees
                            """, (terreno_id, altitude, slope_val, aspect_val))
                    except Exception as e:
                        logger.debug(f'  Metric error for {terreno_id}: {e}')

            conn.commit()
            logger.info(f'✓ Metrics calculated for {state}')
            cur.close()
            conn.close()

        except Exception as e:
            logger.error(f'✗ Metrics insert failed: {e}')

# ============================================================================
# 4. TILE GENERATION — Gerar tiles .pbf com tippecanoe
# ============================================================================

class TileGeneration:
    """Gera vector tiles MBTiles + split z/x/y via tippecanoe"""

    @staticmethod
    def generate_tiles(geojson_file: Path, state: str, min_zoom: int = 8, max_zoom: int = 22):
        """Gerar vector tiles com tippecanoe"""
        logger.info(f'Generating vector tiles for {state} (z{min_zoom}-{max_zoom})...')

        output_mbtiles = OUTPUT_DIR / f'terrenos_{state}.mbtiles'

        try:
            cmd = [
                'tippecanoe',
                '-o', str(output_mbtiles),
                '-Z', str(min_zoom),
                '-z', str(max_zoom),
                '-l', 'terrenos',  # Layer name
                '-f',  # Force overwrite
                '--drop-densest-as-needed',
                '--extend-zooms-if-still-dropping',
                str(geojson_file),
            ]

            logger.info(f'  Running: {" ".join(cmd)}')
            subprocess.run(cmd, check=True)

            size_mb = output_mbtiles.stat().st_size / 1024 / 1024
            logger.info(f'✓ Tiles generated: {output_mbtiles} ({size_mb:.1f} MB)')

            # Extrair para individual tiles (z/x/y.pbf)
            TileGeneration._extract_tiles(output_mbtiles, state)

            return output_mbtiles

        except Exception as e:
            logger.error(f'✗ Tile generation failed: {e}')
            return None

    @staticmethod
    def _extract_tiles(mbtiles_file: Path, state: str):
        """Extract MBTiles → individual z/x/y.pbf files"""
        logger.info(f'Extracting tiles from MBTiles...')

        try:
            import sqlite3

            conn = sqlite3.connect(mbtiles_file)
            cur = conn.cursor()

            tiles_dir = OUTPUT_DIR / f'tiles_{state}'
            tiles_dir.mkdir(exist_ok=True)

            # Query tile_data
            cur.execute('SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles')

            for z, x, y, data in cur.fetchall():
                # MBTiles usa TMS (y invertido); converter para Web Mercator
                max_y = (1 << z) - 1
                web_y = max_y - y

                tile_file = tiles_dir / f'{z}' / f'{x}' / f'{web_y}.pbf'
                tile_file.parent.mkdir(parents=True, exist_ok=True)

                with open(tile_file, 'wb') as f:
                    f.write(data)

            logger.info(f'✓ Tiles extracted to {tiles_dir}')
            conn.close()

        except Exception as e:
            logger.error(f'✗ Tile extraction failed: {e}')

# ============================================================================
# MAIN — Orquestração de fases
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='LandMap GEO ETL Pipeline')
    parser.add_argument('--state', default='MG', help='State to process (MG, SP, RJ, BA, RS)')
    parser.add_argument('--phase', type=int, default=1, help='Phase: 1=ingest, 2=imagery, 3=tiles, 4=upload')
    parser.add_argument('--skip-download', action='store_true', help='Skip downloads (use cached)')

    args = parser.parse_args()

    state = args.state.upper()
    if state not in STATES:
        logger.error(f'Invalid state: {state}')
        sys.exit(1)

    # Setup directories
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    logger.info(f'Starting LandMap GEO ETL Pipeline for {state} (Phase {args.phase})')
    logger.info(f'Temp: {TEMP_DIR}')
    logger.info(f'Output: {OUTPUT_DIR}')

    # =========================================================================
    # PHASE 1: INGEST + PROCESS
    # =========================================================================
    if args.phase >= 1:
        logger.info('=' * 70)
        logger.info('PHASE 1: Data Ingestion & Processing')
        logger.info('=' * 70)

        # Download datasets
        if not args.skip_download:
            incra_file = DataIngestion.download_incra_sigef(state)
            ibge_file = DataIngestion.download_ibge_municipios()
            dem_files = DataIngestion.download_copernicus_dem(state)
        else:
            incra_file = TEMP_DIR / f'incra_sigef_{state}.geojson'
            ibge_file = TEMP_DIR / 'mun_2023.shp'
            dem_files = list(TEMP_DIR.glob('*_dem_30m.tif'))

        # Process
        vector_output = DataProcessing.process_vector_data([incra_file, ibge_file], state)
        dem_output = DataProcessing.process_raster_dem(dem_files, state)

        # Database ingest
        if vector_output:
            DatabaseIngest.insert_terrenos(vector_output, state)

        if dem_output:
            DatabaseIngest.insert_metrics(dem_output, state)

    # =========================================================================
    # PHASE 2: IMAGERY (Sentinel-2/CBERS)
    # =========================================================================
    if args.phase >= 2:
        logger.info('=' * 70)
        logger.info('PHASE 2: Satellite Imagery Download')
        logger.info('=' * 70)

        imagery_files = DataIngestion.download_sentinel2_cbers(state)
        logger.info(f'Imagery files: {len(imagery_files)}')

    # =========================================================================
    # PHASE 3: TILE GENERATION
    # =========================================================================
    if args.phase >= 3:
        logger.info('=' * 70)
        logger.info('PHASE 3: Vector Tile Generation')
        logger.info('=' * 70)

        geojson_file = OUTPUT_DIR / f'terrenos_processed_{state}.geojson'
        if geojson_file.exists():
            TileGeneration.generate_tiles(geojson_file, state)
        else:
            logger.error(f'Processed GeoJSON not found: {geojson_file}')

    # =========================================================================
    # PHASE 4: UPLOAD TO S3 + CDN
    # =========================================================================
    if args.phase >= 4:
        logger.info('=' * 70)
        logger.info('PHASE 4: Upload to S3 + CloudFront Invalidation')
        logger.info('=' * 70)

        # TODO: Implementar upload S3 + CloudFront invalidation
        logger.info('Phase 4 not yet implemented')

    logger.info('=' * 70)
    logger.info(f'✓ Pipeline complete for {state}')
    logger.info('=' * 70)

if __name__ == '__main__':
    main()
