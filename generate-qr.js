const https = require('https');
const http = require('http');
const fs = require('fs');

const qrcode = require('qrcode');

async function generateQR() {
  const url = 'https://trae-ide-cn的手动打开preview.html文件';

  const qrBuffer = await qrcode.toBuffer('file:///workspace/preview.html', {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  fs.writeFileSync('/workspace/qrcode.png', qrBuffer);
  console.log('二维码已生成: /workspace/qrcode.png');
}

generateQR().catch(console.error);
