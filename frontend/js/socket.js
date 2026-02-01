let socket;

async function initSocket() {
  const { data } = await supabase.auth.getSession();
  const token = data.session.access_token;

  socket = new WebSocket(
    `wss://YOUR_RENDER_URL?token=${token}`
  );

  socket.onopen = () => console.log("🟢 WS connected");

  socket.onmessage = (e) => {
    const event = JSON.parse(e.data);

    switch (event.type) {
      case "BALANCE_UPDATE":
        updateBalanceUI(event.payload);
        break;

      case "TRANSFER":
        showToast("Transfer completed");
        break;

      case "EXPENSE":
        showToast("Expense added");
        break;
    }
  };

  socket.onclose = () => console.log("🔴 WS closed");
}

function sendEvent(type, payload) {
  socket?.send(JSON.stringify({ type, payload }));
}
