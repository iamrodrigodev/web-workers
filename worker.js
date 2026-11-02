/* Adaptador del Worker: lectura y análisis fuera del hilo principal. */
importScripts('analizador-csv.js');
self.onmessage = async ({ data: archivo }) => {
  try {
    const inicio = performance.now();
    const contenido = await archivo.text();
    const resultado = analizarCsv(contenido);
    self.postMessage({
      ...resultado,
      ejecucion: {
        hilo: 'Web Worker',
        sinAccesoAlDom: typeof document === 'undefined',
        duracionMs: Number((performance.now() - inicio).toFixed(2))
      }
    });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
