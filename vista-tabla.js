/** Presentación y paginación: nunca interpreta los datos como HTML. */
export class VistaTabla {
  constructor(elementos, tamanoPagina = 50) {
    this.elementos = elementos;
    this.tamanoPagina = tamanoPagina;
    this.encabezados = [];
    this.registros = [];
    this.pagina = 0;
    elementos.anterior.onclick = () => this.cambiarPagina(-1);
    elementos.siguiente.onclick = () => this.cambiarPagina(1);
  }

  mostrar(nombre, { encabezados, registros, ejecucion }) {
    this.elementos.evidencia.textContent = ejecucion?.sinAccesoAlDom
      ? `Hilo secundario sin acceso al DOM · Lectura y análisis: ${ejecucion.duracionMs.toLocaleString('es')} ms · Resultado recibido por postMessage`
      : 'No se pudo verificar el contexto de ejecución.';
    this.encabezados = encabezados;
    this.registros = registros;
    this.pagina = 0;
    this.elementos.nombre.textContent = nombre;
    this.elementos.totalFilas.textContent = registros.length.toLocaleString('es');
    this.elementos.totalColumnas.textContent = encabezados.length;
    this.elementos.resultados.hidden = false;
    this.renderizar();
  }

  limpiar() {
    this.encabezados = [];
    this.registros = [];
    this.pagina = 0;
    this.elementos.tabla.replaceChildren();
    this.elementos.resultados.hidden = true;
  }

  cambiarPagina(desplazamiento) {
    const destino = this.pagina + desplazamiento;
    if (destino < 0 || destino * this.tamanoPagina >= this.registros.length) return;
    this.pagina = destino;
    this.renderizar();
  }

  renderizar() {
    const { tabla, rango, anterior, siguiente } = this.elementos;
    tabla.replaceChildren();
    const descripcion = tabla.createCaption();
    descripcion.className = 'sr-only';
    descripcion.textContent = 'Contenido del archivo CSV importado';
    const filaEncabezado = tabla.createTHead().insertRow();
    ['#', ...this.encabezados].forEach(valor => {
      const celda = document.createElement('th');
      celda.scope = 'col';
      celda.textContent = valor;
      filaEncabezado.append(celda);
    });
    const cuerpo = tabla.createTBody();
    const inicio = this.pagina * this.tamanoPagina;
    const fin = Math.min(inicio + this.tamanoPagina, this.registros.length);
    this.registros.slice(inicio, fin).forEach((registro, indice) => {
      const fila = cuerpo.insertRow();
      [String(inicio + indice + 1).padStart(2, '0'), ...registro].forEach(valor => {
        const celda = fila.insertCell();
        celda.textContent = valor;
        celda.title = valor;
      });
    });
    rango.textContent = this.registros.length ? `Mostrando ${inicio + 1}–${fin} de ${this.registros.length} registros` : 'El archivo contiene solo encabezados.';
    anterior.disabled = this.pagina === 0;
    siguiente.disabled = fin >= this.registros.length;
  }
}
