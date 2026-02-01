const socket = new WebSocket("wss://YOUR_RENDER_URL");

socket.onopen = () => {
  console.log("🟢 WebSocket connected");
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "BALANCE_UPDATE") {
    updateBalanceUI(data.payload);
  }

  if (data.type === "TRANSFER_SUCCESS") {
    showToast("Transfer completed in real time!");
  }
};

socket.onclose = () => {
  console.log("🔴 WebSocket disconnected");
};

function sendSocketEvent(type, payload) {
  socket.send(JSON.stringify({ type, payload }));
}
