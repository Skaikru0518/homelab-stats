import { readDevice } from "./src/lib/tasmota";

async function main() {
  for (const host of ["192.168.50.250", "192.168.50.251", "192.168.50.252"]) {
    try {
      console.log("OK  ", host, JSON.stringify(await readDevice({ id: "x", host })));
    } catch (e) {
      console.log("HIBA", host, (e as Error).message);
    }
  }
}
main();
