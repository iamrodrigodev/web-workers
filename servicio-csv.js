/** Encapsula el ciclo de vida del Worker; no conoce la interfaz. */
export class ServicioCsv {
  #trabajador = null;
  #rechazarPendiente = null;

  procesar(archivo) {
    this.cancelar();
    return new Promise((resolver, rechazar) => {
      if (!/\.csv$/i.test(archivo.name)) return rechazar(new Error('Selecciona un archivo con extensión .csv.'));
      if (archivo.size > 20 * 1024 * 1024) return rechazar(new Error('El archivo supera el límite de 20 MB.'));
      if (!window.Worker) return rechazar(new Error('Este navegador no admite Web Workers.'));
      this.#rechazarPendiente = rechazar;
      try {
        this.#trabajador = new Worker('worker.js');
        this.#trabajador.onmessage = ({ data: resultado }) => {
          this.#liberar();
          if (resultado.error) rechazar(new Error(resultado.error));
          else resolver(resultado);
        };
        this.#trabajador.onerror = () => {
          this.#liberar();
          rechazar(new Error('No se pudo iniciar el Worker. Abre la página desde un servidor HTTP local.'));
        };
        this.#trabajador.postMessage(archivo);
      } catch (error) {
        this.#liberar();
        rechazar(error);
      }
    });
  }

  cancelar() {
    const rechazar = this.#rechazarPendiente;
    this.#liberar();
    if (rechazar) rechazar(new DOMException('Carga cancelada.', 'AbortError'));
  }

  #liberar() {
    this.#trabajador?.terminate();
    this.#trabajador = null;
    this.#rechazarPendiente = null;
  }
}
