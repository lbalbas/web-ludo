package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"os"
	"web-ludo-server/internal/ws"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
)

func main() {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:5173"
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{allowedOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
	}))

	hubManager := ws.NewHubManager()

	r.Get("/api", func(w http.ResponseWriter, r *http.Request) {
		response := map[string]string{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})

	r.Post("/api/lobbies", func(w http.ResponseWriter, r *http.Request) {
		hubID := uuid.New().String()
		isPrivate := r.URL.Query().Get("private") == "true"
		hubManager.CreateHub(hubID, isPrivate)
		w.Write([]byte(hubID))
	})

	r.Get("/api/lobbies", func(w http.ResponseWriter, r *http.Request) {
		hubs := hubManager.ListHubs()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(hubs)
	})

	r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWs(hubManager, w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...\n", port)
	err := http.ListenAndServe(":"+port, r)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
