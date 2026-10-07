package main

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type fakeStore struct {
	entries  []string
	readyErr error
}

func (f *fakeStore) Entries(context.Context) ([]string, error) {
	return append([]string(nil), f.entries...), nil
}

func (f *fakeStore) Add(_ context.Context, entry string) error {
	f.entries = append(f.entries, entry)
	return nil
}

func (f *fakeStore) Ready(context.Context) error {
	return f.readyErr
}

func TestLivenessDoesNotDependOnRedis(t *testing.T) {
	app := newApplication(&fakeStore{readyErr: errors.New("redis unavailable")})
	req := httptest.NewRequest(http.MethodGet, "/livez", nil)
	res := httptest.NewRecorder()

	app.ServeHTTP(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", res.Code)
	}
	if strings.TrimSpace(res.Body.String()) != "alive" {
		t.Fatalf("expected alive response, got %q", res.Body.String())
	}
}

func TestReadinessReflectsRedisAvailability(t *testing.T) {
	tests := []struct {
		name       string
		readyErr   error
		wantStatus int
	}{
		{name: "available", wantStatus: http.StatusOK},
		{name: "unavailable", readyErr: errors.New("connection refused"), wantStatus: http.StatusServiceUnavailable},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			app := newApplication(&fakeStore{readyErr: tc.readyErr})
			req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
			res := httptest.NewRecorder()

			app.ServeHTTP(res, req)

			if res.Code != tc.wantStatus {
				t.Fatalf("expected %d, got %d", tc.wantStatus, res.Code)
			}
		})
	}
}

func TestGuestbookAddsAndListsEntries(t *testing.T) {
	store := &fakeStore{entries: []string{"first"}}
	app := newApplication(store)

	post := httptest.NewRequest(http.MethodPost, "/api/entries", strings.NewReader(`{"message":"second"}`))
	post.Header.Set("Content-Type", "application/json")
	postRes := httptest.NewRecorder()
	app.ServeHTTP(postRes, post)
	if postRes.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", postRes.Code, postRes.Body.String())
	}

	get := httptest.NewRequest(http.MethodGet, "/api/entries", nil)
	getRes := httptest.NewRecorder()
	app.ServeHTTP(getRes, get)
	if getRes.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", getRes.Code)
	}
	if got := strings.TrimSpace(getRes.Body.String()); got != `{"entries":["first","second"]}` {
		t.Fatalf("unexpected body: %s", got)
	}
}

func TestGuestbookRejectsEmptyEntries(t *testing.T) {
	app := newApplication(&fakeStore{})
	req := httptest.NewRequest(http.MethodPost, "/api/entries", strings.NewReader(`{"message":"   "}`))
	res := httptest.NewRecorder()

	app.ServeHTTP(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", res.Code)
	}
}

