import request from './index'

export function getQrCode() {
  return request.get('/qrcode')
}

