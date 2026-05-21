const pedestrianFields = [
  { direction: "north", remainingField: "ntPdsgRmdrCs", statusField: "ntPdsgStatNm" },
  { direction: "east", remainingField: "etPdsgRmdrCs", statusField: "etPdsgStatNm" },
  { direction: "south", remainingField: "stPdsgRmdrCs", statusField: "stPdsgStatNm" },
  { direction: "west", remainingField: "wtPdsgRmdrCs", statusField: "wtPdsgStatNm" },
  { direction: "northEast", remainingField: "nePdsgRmdrCs", statusField: "nePdsgStatNm" },
  { direction: "southEast", remainingField: "sePdsgRmdrCs", statusField: "sePdsgStatNm" },
  { direction: "southWest", remainingField: "swPdsgRmdrCs", statusField: "swPdsgStatNm" },
  { direction: "northWest", remainingField: "nwPdsgRmdrCs", statusField: "nwPdsgStatNm" }
];

export const normalizePedestrianSignals = (rawResponse) => {
  const rows = extractRows(rawResponse);

  return rows.flatMap((row) =>
    pedestrianFields.flatMap((field) => {
      const rawRemaining = row[field.remainingField];
      const remainingCentiseconds = parseRemainingCentiseconds(rawRemaining);

      if (remainingCentiseconds === undefined) {
        return [];
      }

      const statusName = parseOptionalString(row[field.statusField]);
      const isUnavailable = remainingCentiseconds >= 36001;

      const signal = {
        direction: field.direction,
        remainingSeconds: isUnavailable ? null : remainingCentiseconds / 10,
        unavailable: isUnavailable,
        rawRemainingValue: remainingCentiseconds,
        rawRemainingCentisecondsField: field.remainingField
      };

      if (statusName !== undefined) {
        signal.statusName = statusName;
      }

      return [signal];
    })
  );
};

const extractRows = (rawResponse) => {
  if (Array.isArray(rawResponse)) {
    return rawResponse.filter(isRecord);
  }

  if (!isRecord(rawResponse)) {
    return [];
  }

  const directRows = rawResponse.row ?? rawResponse.rows ?? rawResponse.items;
  if (Array.isArray(directRows)) {
    return directRows.filter(isRecord);
  }

  if (isRecord(rawResponse.result)) {
    return extractRows(rawResponse.result);
  }

  if (isRecord(rawResponse.response)) {
    return extractRows(rawResponse.response);
  }

  if (isRecord(rawResponse.body)) {
    return extractRows(rawResponse.body);
  }

  return [rawResponse];
};

const parseRemainingCentiseconds = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseOptionalString = (value) => {
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const isRecord = (value) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
