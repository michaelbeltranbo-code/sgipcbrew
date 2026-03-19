import { http } from "./http";

export type Client = {
  id: number;
  name: string;
};

export async function listClients(): Promise<Client[]> {
  const { data } = await http.get("/clients");
  return data;
}
