
export function toTitle(str, separator = ' ') {
    return str.toLowerCase().split(separator).map((word) => {
        return word === 'id' ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
}

export function toDateString(value, includeDay = false) {
    let date = value instanceof Date ? value : new Date(value)
    const options = {
        year: "numeric",
        month: 'long'
    }

    if (includeDay) {
        options.day = 'numeric'
    }
    return date.toLocaleDateString("en-US", options)
}
