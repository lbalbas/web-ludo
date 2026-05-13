package ws

import "sync"

type HubManager struct {
	mu   sync.RWMutex
	hubs map[string]*Hub
}

func NewHubManager() *HubManager {
	return &HubManager{
		hubs: make(map[string]*Hub),
	}
}

func (l *HubManager) CreateHub(id string) {
	hub := NewHub(id)
	go hub.Run()

	l.mu.Lock()
	defer l.mu.Unlock()
	l.hubs[id] = hub
}

func (l *HubManager) GetHub(id string) (*Hub, bool) {
	l.mu.RLock()
	defer l.mu.RUnlock()
	hub, ok := l.hubs[id]
	return hub, ok
}

func (l *HubManager) RemoveHub(id string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.hubs, id)
}

func (l *HubManager) ListHubs() []string {
	l.mu.RLock()
	defer l.mu.RUnlock()
	ids := make([]string, 0, len(l.hubs))
	for id := range l.hubs {
		ids = append(ids, id)
	}
	return ids
}
