package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const entriesKey = "guestbook:entries"

type Store interface {
	Entries(context.Context) ([]string, error)
	Add(context.Context, string) error
	Ready(context.Context) error
}

type redisStore struct {
	client *redis.Client
}

func (s *redisStore) Entries(ctx context.Context) ([]string, error) {
	return s.client.LRange(ctx, entriesKey, 0, -1).Result()
}

func (s *redisStore) Add(ctx context.Context, entry string) error {
	return s.client.RPush(ctx, entriesKey, entry).Err()
}

func (s *redisStore) Ready(ctx context.Context) error {
	return s.client.Ping(ctx).Err()
}

func newApplication(store Store) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("GET /", http.FileServer(http.Dir("public")))
	mux.HandleFunc("GET /livez", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("alive\n"))
	})
	mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 800*time.Millisecond)
		defer cancel()
		if err := store.Ready(ctx); err != nil {
			http.Error(w, "redis unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("ready\n"))
	})
	mux.HandleFunc("GET /api/entries", func(w http.ResponseWriter, r *http.Request) {
		entries, err := store.Entries(r.Context())
		if err != nil {
			writeJSONError(w, http.StatusServiceUnavailable, "redis unavailable")
			return
		}
		if entries == nil {
			entries = []string{}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string][]string{"entries": entries})
	})
	mux.HandleFunc("POST /api/entries", func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Message string `json:"message"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid JSON")
			return
		}
		payload.Message = strings.TrimSpace(payload.Message)
		if payload.Message == "" {
			writeJSONError(w, http.StatusBadRequest, "message is required")
			return
		}
		if err := store.Add(r.Context(), payload.Message); err != nil {
			writeJSONError(w, http.StatusServiceUnavailable, "redis unavailable")
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": payload.Message})
	})
	return requestLogger(mux)
}

func writeJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("method=%s path=%s duration_ms=%d", r.Method, r.URL.Path, time.Since(started).Milliseconds())
	})
}

func main() {
	redisAddress := os.Getenv("REDIS_ADDRESS")
	if redisAddress == "" {
		redisAddress = "redis-master:6379"
	}
	client := redis.NewClient(&redis.Options{
		Addr:         redisAddress,
		DialTimeout:  time.Second,
		ReadTimeout:  time.Second,
		WriteTimeout: time.Second,
	})
	defer func() {
		if err := client.Close(); err != nil && !errors.Is(err, redis.ErrClosed) {
			log.Printf("close redis client: %v", err)
		}
	}()

	server := &http.Server{
		Addr:              ":3000",
		Handler:           newApplication(&redisStore{client: client}),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("guestbook listening on %s with redis=%s", server.Addr, redisAddress)
	log.Fatal(server.ListenAndServe())
}

