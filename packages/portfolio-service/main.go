package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

var db *sql.DB

type PortfolioAnalytics struct {
	UserID            string  `json:"user_id"`
	TotalInvestedCents int64  `json:"total_invested_cents"`
	ROIPct            float64 `json:"roi_pct"`
	RiskExposurePct   float64 `json:"risk_exposure_pct"`
	ROI1M             float64 `json:"roi_1m"`
	ROI3M             float64 `json:"roi_3m"`
	ROI6M             float64 `json:"roi_6m"`
	ROIYtd            float64 `json:"roi_ytd"`
	PropertyCount     int     `json:"property_count"`
	UpdatedAt         string  `json:"updated_at"`
}

func init() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://dev:dev@postgres:5432/landmap"
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	log.Println("✅ Connected to PostgreSQL")
}

func main() {
	defer db.Close()

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "portfolio-service",
		})
	})

	router.GET("/api/v1/portfolio/analytics", getPortfolioAnalytics)

	port := os.Getenv("SERVICE_PORT")
	if port == "" {
		port = "3004"
	}

	fmt.Printf("🚀 Portfolio Service starting on port %s\n", port)
	router.Run(":" + port)
}

func getPortfolioAnalytics(c *gin.Context) {
	userID := c.GetHeader("x-user-id")
	if userID == "" {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	// Query aggregated portfolio data
	var analytics PortfolioAnalytics
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN status = 'completed' THEN amount_cents ELSE 0 END), 0) as total_invested,
			COALESCE(AVG(CASE WHEN status = 'completed' THEN roi_pct ELSE 0 END), 0) as roi_pct,
			COALESCE(AVG(risk_score), 0) as risk_exposure,
			COUNT(DISTINCT CASE WHEN created_at > NOW() - INTERVAL '1 month' THEN id END) as prop_1m,
			COUNT(DISTINCT id) as total_properties,
			NOW()::text as updated_at
		FROM transactions t
		LEFT JOIN offers o ON t.id = o.transaction_id
		LEFT JOIN users u ON o.buyer_id = u.id
		WHERE u.id::text = $1
	`

	err := db.QueryRow(query, userID).Scan(
		&analytics.TotalInvestedCents,
		&analytics.ROIPct,
		&analytics.RiskExposurePct,
		&analytics.ROI1M,
		&analytics.ROI3M,
		&analytics.ROI6M,
		&analytics.PropertyCount,
		&analytics.UpdatedAt,
	)

	if err != nil && err != sql.ErrNoRows {
		log.Printf("Query error: %v", err)
		c.JSON(500, gin.H{"error": "Failed to fetch analytics"})
		return
	}

	analytics.UserID = userID

	c.JSON(200, analytics)
}
