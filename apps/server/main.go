package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

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

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
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
		hubManager.CreateHub(hubID)
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

	log.Println("Server starting on port 8080...")
	err := http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
