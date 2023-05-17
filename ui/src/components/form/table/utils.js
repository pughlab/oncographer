
export function toTitle(str, separator = ' ') {
    return str.toLowerCase().split(separator).map((word) => {
        return word === 'id' ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
}

export function toDateString(value) {
    let date = value instanceof Date ? value : new Date(value)
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: 'long'
    })
}
