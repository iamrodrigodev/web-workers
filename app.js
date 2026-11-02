import { ServicioCsv } from './servicio-csv.js';
import { VistaTabla } from './vista-tabla.js';

const obtenerElemento = identificador => document.getElementById(identificador);
const servicio = new ServicioCsv();
const vista = new VistaTabla({
  evidencia: obtenerElemento('worker-evidence'),
  tabla: obtenerElemento('table'), resultados: obtenerElemento('results'),
  nombre: obtenerElemento('filename'), totalFilas: obtenerElemento('rows'),
  totalColumnas: obtenerElemento('columns'), rango: obtenerElemento('range'),
  anterior: obtenerElemento('prev'), siguiente: obtenerElemento('next')
});
const entradaArchivo = obtenerElemento('file');
const zonaCarga = obtenerElemento('dropzone');
let versionCarga = 0;

function mostrarEstado(mensaje, esError = false, tipo = '') {
  const estado = obtenerElemento('status');
  estado.textContent = mensaje;
  estado.classList.toggle('error', esError);
  estado.classList.toggle('success', tipo === 'exito');
  estado.classList.toggle('loading', tipo === 'cargando');
  zonaCarga.setAttribute('aria-busy', String(tipo === 'cargando'));
  obtenerElemento('empty-state').hidden = !obtenerElemento('results').hidden;
}

async function cargarArchivo(archivo) {
  if (!archivo) return;
  const versionActual = ++versionCarga;
  vista.limpiar();
  mostrarEstado('Preparando tu tabla. Estamos leyendo y organizando el archivo…', false, 'cargando');
  try {
    const resultado = await servicio.procesar(archivo);
    if (versionActual !== versionCarga) return;
    vista.mostrar(archivo.name, resultado);
    mostrarEstado('✓ Tu archivo está listo. Explora sus registros en la tabla.', false, 'exito');
  } catch (error) {
    if (versionActual === versionCarga && error.name !== 'AbortError') mostrarEstado(error.message, true);
  } finally {
    if (versionActual === versionCarga) entradaArchivo.value = '';
  }
}

function limpiarInterfaz() {
  versionCarga++;
  servicio.cancelar();
  vista.limpiar();
  entradaArchivo.value = '';
  mostrarEstado('Listo para recibir tu archivo.');
}

async function cargarEjemplo() {
  const versionActual = ++versionCarga;
  servicio.cancelar();
  try {
    const respuesta = await fetch('ejemplo.csv');
    if (!respuesta.ok) throw new Error('No se pudo leer el archivo de ejemplo.');
    const contenido = await respuesta.blob();
    if (versionActual === versionCarga) cargarArchivo(new File([contenido], 'ejemplo.csv', { type: 'text/csv' }));
  } catch (error) {
    if (versionActual === versionCarga) mostrarEstado(error.message, true);
  }
}

entradaArchivo.addEventListener('change', evento => cargarArchivo(evento.target.files[0]));
obtenerElemento('clear').addEventListener('click', limpiarInterfaz);
obtenerElemento('example').addEventListener('click', cargarEjemplo);
['dragenter', 'dragover'].forEach(nombreEvento => zonaCarga.addEventListener(nombreEvento, evento => {
  evento.preventDefault();
  zonaCarga.classList.add('over');
}));
['dragleave', 'drop'].forEach(nombreEvento => zonaCarga.addEventListener(nombreEvento, evento => {
  evento.preventDefault();
  zonaCarga.classList.remove('over');
}));
zonaCarga.addEventListener('drop', evento => cargarArchivo(evento.dataTransfer.files[0]));
