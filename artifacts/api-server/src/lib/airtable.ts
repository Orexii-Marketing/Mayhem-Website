const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = "https://api.airtable.com/v0";

export function isAirtableConfigured(): boolean {
  return !!AIRTABLE_API_KEY && !!AIRTABLE_BASE_ID;
}

export interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  fields: T;
  createdTime?: string;
}

export async function listAirtableRecords<T = Record<string, unknown>>(
  tableName: string,
  params?: { filterByFormula?: string; sort?: { field: string; direction?: "asc" | "desc" }[] },
): Promise<AirtableRecord<T>[]> {
  if (!isAirtableConfigured()) return [];

  const url = new URL(
    `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
  );
  if (params?.filterByFormula) {
    url.searchParams.set("filterByFormula", params.filterByFormula);
  }
  if (params?.sort?.length) {
    params.sort.forEach((s, i) => {
      url.searchParams.set(`sort[${i}][field]`, s.field);
      url.searchParams.set(`sort[${i}][direction]`, s.direction ?? "asc");
    });
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { records: AirtableRecord<T>[] };
  return data.records;
}

export async function createAirtableRecord(
  tableName: string,
  fields: Record<string, string | number | boolean | null | undefined>,
): Promise<string | null> {
  if (!isAirtableConfigured()) {
    return null;
  }

  const response = await fetch(
    `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}
