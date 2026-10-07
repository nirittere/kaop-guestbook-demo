const form = document.getElementById('entry-form');
const message = document.getElementById('message');
const status = document.getElementById('status');
const entries = document.getElementById('entries');

async function loadEntries() {
  const response = await fetch('/api/entries');
  if (!response.ok) throw new Error('The data service is unavailable');
  const data = await response.json();
  entries.replaceChildren(...data.entries.map((entry) => {
    const item = document.createElement('li');
    item.textContent = entry;
    return item;
  }));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = 'Saving...';
  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: message.value})
    });
    if (!response.ok) throw new Error('The data service is unavailable');
    message.value = '';
    await loadEntries();
    status.textContent = 'Saved';
  } catch (error) {
    status.textContent = error.message;
  }
});

loadEntries().catch((error) => { status.textContent = error.message; });

