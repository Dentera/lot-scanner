document.getElementById('startButton').addEventListener('click', async () => {
  const outputDiv = document.getElementById('output');
  const errorDiv = document.getElementById('error');
  outputDiv.textContent = '';
  errorDiv.textContent = '';

  try {
    const videoElement = document.getElementById('video');
    const selectedDeviceId = (await window.ZXingBrowser.BrowserMultiFormatReader.listVideoInputDevices())[0]?.deviceId;

    const codeReader = new window.ZXingBrowser.BrowserMultiFormatReader();
    await codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
      if (result) {
        const raw = result.getText();
        outputDiv.innerHTML = `<b>✅ Barkod:</b> ${raw}`;
        console.log("Barkod:", raw);
      }
    });
  } catch (e) {
    errorDiv.innerHTML = `❌ Kamera açılamadı: ${e}`;
  }
});