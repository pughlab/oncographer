import { Field } from "./form/dynamic_form/types";

export function toTitle(str: string, separator: string = " ") {
  return str
    .toLowerCase()
    .split(separator)
    .map((word) => {
      return word === "id"
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function toDateString(value: any) {
  let date;
  let resolution = "month";

  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    try {
      date = JSON.parse(`${value}`);
    } catch (error) {
      date = value;
    }
  }
  if (typeof date === "object") {
    resolution = date.resolution;
    date = new Date(date.value);
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  const options: any = {
    year: "numeric",
  };

  if (resolution === "month") {
    options.month = "long";
  }

  if (resolution === "day") {
    options.month = "long";
    options.day = "numeric";
  }
  return date.toLocaleDateString("en-US", options);
}

export function findDescription(field: Field, study: string) {
  let description = ""
  if (typeof field.description === "string") {
    try {
      const descriptionObject = JSON.parse(field.description)
      description = descriptionObject[study]
    } catch (_error) {
      description = field.description
    }
  } else if (typeof field.description === "object") {
    description = field.description[study]
  }
  return description
}
