
export function toTitle(str, separator = ' ') {
    return str.toLowerCase().split(separator).map((word) => {
        return word === 'id' ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
}

export function toDateString(value) {
    let date
    let resolution = "month"

    if (!value) {
        return ""
    }

    if (typeof value === "string") {
        try {
            date = JSON.parse(`${value}`)
        } catch (error) {
            date = value
        }
    }
    if (typeof date === "object") {
        resolution = date.resolution
        date = new Date(date.value)
    } else if (value instanceof Date) {
        date = value
    } else {
        date = new Date(value)
    }

    const options = {
        year: "numeric"
    }

    if (resolution === 'month') {
        options.month = 'long'
    }

    if (resolution === 'day') {
        options.month = 'long'
        options.day = 'numeric'
    }
    return date.toLocaleDateString("en-US", options)
}
