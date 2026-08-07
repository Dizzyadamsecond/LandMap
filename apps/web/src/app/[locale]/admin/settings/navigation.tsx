'use client';

import { useCallback, useMemo, useState } from 'react';
import { Menu, Star, X, Plus } from '@/components/lovable/icons';
import { ADMIN_NAVIGATION, getAllAdminNavItems } from '@/lib/admin-navigation';

/**
 * Navigation Management Settings Page
 * Allows reordering and managing favorite routes
 */
export default function NavigationSettingsPage() {
  const allItems = getAllAdminNavItems();
  const [favorites, setFavorites] = useState<string[]>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('admin-favorites');
        return saved ? JSON.parse(saved) : ['dashboard', 'leads', 'analytics'];
      } catch {
        return ['dashboard', 'leads', 'analytics'];
      }
    }
    return ['dashboard', 'leads', 'analytics'];
  });

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Save to localStorage
  const saveFavorites = useCallback((newFavorites: string[]) => {
    setFavorites(newFavorites);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-favorites', JSON.stringify(newFavorites));
    }
  }, []);

  const toggleFavorite = (itemId: string) => {
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter((id) => id !== itemId)
      : [...favorites, itemId];
    saveFavorites(newFavorites);
  };

  const removeFavorite = (itemId: string) => {
    saveFavorites(favorites.filter((id) => id !== itemId));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newFavorites = [...favorites];
    const [item] = newFavorites.splice(fromIndex, 1);
    newFavorites.splice(toIndex, 0, item);
    saveFavorites(newFavorites);
  };

  const favoriteItems = useMemo(
    () => favorites.map((id) => allItems.find((item) => item.id === id)).filter(Boolean),
    [favorites, allItems]
  );

  const availableItems = useMemo(
    () => allItems.filter((item) => !favorites.includes(item.id)),
    [favorites, allItems]
  );

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Gerenciar Navegação
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Organize seus atalhos favoritos e a ordem de aparição na barra lateral
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Favorites Section */}
        <div className="rounded-lg border border-[var(--border)] p-6 bg-[var(--card)]">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Favoritos ({favorites.length})
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Arraste para reordenar. Esses aparecem no topo do menu.
            </p>
          </div>

          <div className="space-y-2">
            {favoriteItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Nenhum favorito adicionado
                </p>
              </div>
            ) : (
              favoriteItems.map((item, index) => {
                if (!item) return null;
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItem(item.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedItem && draggedItem !== item.id) {
                        const draggedIndex = favorites.indexOf(draggedItem);
                        moveItem(draggedIndex, index);
                      }
                    }}
                    onDragEnd={() => setDraggedItem(null)}
                    className={`group flex items-center gap-3 rounded-lg border p-3 transition ${
                      draggedItem === item.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]'
                    }`}
                  >
                    <Menu className="h-4 w-4 text-[var(--muted-foreground)] cursor-move" />
                    <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="rounded-lg p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
                      title="Remover favorito"
                      aria-label={`Remover ${item.label} dos favoritos`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Available Routes Section */}
        <div className="rounded-lg border border-[var(--border)] p-6 bg-[var(--card)]">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Rotas Disponíveis ({availableItems.length})
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Clique no + para adicionar aos favoritos
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 hover:border-[var(--primary)] hover:bg-[var(--muted)] transition"
                >
                  <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="rounded-lg p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
                    title="Adicionar aos favoritos"
                    aria-label={`Adicionar ${item.label} aos favoritos`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-4">
        <h3 className="font-semibold text-sm text-[var(--foreground)] mb-2">
          Dicas de Uso
        </h3>
        <ul className="space-y-1 text-sm text-[var(--muted-foreground)]">
          <li>• Suas preferências são salvas automaticamente no navegador</li>
          <li>• Até 12 favoritos podem ser adicionados</li>
          <li>• Arrastar para reordenar a ordem de aparição</li>
          <li>• Use a busca da barra lateral para encontrar rotas rapidamente</li>
        </ul>
      </div>
    </div>
  );
}
