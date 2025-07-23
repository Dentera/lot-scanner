
let video = document.getElementById('video');
let output = document.getElementById('output');
let scanning = false;

async function startScanner() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } }
    });
    video.srcObject = stream;
    scanning = true;
    output.innerText = "📡 Kamera başlatıldı, barkodu okutun...";

    const codeReader = new ZXing.BrowserMultiFormatReader();
    codeReader.decodeFromVideoDevice(null, 'video', (result, err) => {
      if (result && scanning) {
        scanning = false;
        output.innerText = "🔍 Barkod: " + result.text;
        const parsed = parseBarcode(result.text);
        if (parsed) {
          output.innerText += "\nGTIN: " + (parsed.gtin || '-') +
                              "\nLOT: " + (parsed.lot || '-') +
                              "\nSKT: " + (parsed.skt || '-');
          sendToSheets(parsed);
        } else {
          output.innerText += "\n❌ Barkod ayrıştırılamadı";
        }
      }
    });
  } catch (e) {
    output.innerText = "🚫 Kamera açılamadı: " + e;
  }
}

function parseBarcode(text) {
  if (text.includes("(01)") && text.includes("(10)")) {
    const gtin = text.match(/\(01\)(\d{14})/);
    const lot = text.match(/\(10\)([\w\d]+)/);
    const skt = text.match(/\(17\)(\d{6})/);
    return {
      type: "GS1",
      gtin: gtin ? gtin[1] : "",
      lot: lot ? lot[2] : "",
      skt: skt ? formatDate(skt[1]) : ""
    };
  } else if (text.startsWith("+")) {
    // HIBC örnek: +E12345/$S$32101011234567*
    const lot = text.match(/\$S\$(\d{7})/);
    const skt = text.match(/\d{6,8}/g);
    return {
      type: "HIBC",
      gtin: "",
      lot: lot ? lot[1] : "",
      skt: skt && skt.length > 1 ? formatDate(skt[1]) : ""
    };
  }
  return null;
}

function formatDate(yyyymmdd) {
  if (yyyymmdd.length !== 6) return yyyymmdd;
  return "20" + yyyymmdd.slice(0, 2) + "-" + yyyymmdd.slice(2, 4) + "-" + yyyymmdd.slice(4);
}

function sendToSheets(data) {
  fetch("https://sheetdb.io/api/v1/3kq28u4m2t6hg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        timestamp: new Date().toLocaleString("tr-TR"),
        type: data.type,
        gtin: data.gtin,
        lot: data.lot,
        skt: data.skt
      }]
    })
  }).then(res => output.innerText += "\n✅ Google Sheets'e gönderildi")
    .catch(err => output.innerText += "\n🚫 Sheets'e gönderme hatası: " + err);
}
