function transferMoney(from, to, amount) {
  // Save to DB via API (not shown here)

  // Notify all clients
  sendSocketEvent("TRANSFER_SUCCESS", {
    from,
    to,
    amount,
    time: new Date()
  });
}
