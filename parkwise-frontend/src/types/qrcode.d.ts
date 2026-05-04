declare module 'qrcode' {
  const QRCode: {
    toDataURL(value: string, options?: { width?: number; margin?: number }): Promise<string>
  }

  export default QRCode
}
