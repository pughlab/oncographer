export const getFormat = (resolution: string) => {
  let format = ""
    switch (resolution) {
      case "year":
        format = "yyyy"
        break
      case "day":
        format = "dd/MM/yyyy"
        break
      default:
        format = "MM/yyyy"
  }
  return format
}
