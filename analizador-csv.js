/** Analiza CSV sin depender del DOM ni de Web Workers. */
function analizarCsv(contenido) {
  const texto = contenido.replace(/^\uFEFF/, '');
  if (!texto.trim()) throw new Error('El archivo está vacío.');
  const separador = detectarSeparador(texto);
  const registros = [];
  let registro = [], campo = '', entreComillas = false, comillasCerradas = false;

  function agregarCampo() {
    registro.push(campo);
    campo = '';
    comillasCerradas = false;
  }
  function agregarRegistro() {
    agregarCampo();
    if (registro.some(valor => valor.trim() !== '')) registros.push(registro);
    registro = [];
  }

  for (let indice = 0; indice < texto.length; indice++) {
    const caracter = texto[indice];
    if (entreComillas) {
      if (caracter !== '"') campo += caracter;
      else if (texto[indice + 1] === '"') { campo += '"'; indice++; }
      else { entreComillas = false; comillasCerradas = true; }
    } else if (caracter === separador) agregarCampo();
    else if (caracter === '\n' || caracter === '\r') {
      agregarRegistro();
      if (caracter === '\r' && texto[indice + 1] === '\n') indice++;
    } else if (caracter === '"') {
      if (campo !== '' || comillasCerradas) throw new Error('Comillas inesperadas en el archivo CSV.');
      entreComillas = true;
    } else {
      if (comillasCerradas) throw new Error('Contenido inesperado después de cerrar comillas.');
      campo += caracter;
    }
  }
  if (entreComillas) throw new Error('Hay un campo con comillas sin cerrar.');
  if (campo !== '' || registro.length || comillasCerradas) agregarRegistro();
  if (!registros.length) throw new Error('No se encontraron datos.');
  const encabezados = registros.shift().map((valor, indice) => valor.trim() || `Columna ${indice + 1}`);
  const indiceInvalido = registros.findIndex(fila => fila.length !== encabezados.length);
  if (indiceInvalido !== -1) throw new Error(`El registro ${indiceInvalido + 1} tiene ${registros[indiceInvalido].length} campos; se esperaban ${encabezados.length}.`);
  return { encabezados, registros };
}

function detectarSeparador(texto) {
  const frecuencias = { ',': 0, ';': 0, '\t': 0 };
  let entreComillas = false;
  for (let indice = 0; indice < texto.length; indice++) {
    const caracter = texto[indice];
    if (caracter === '"') {
      if (entreComillas && texto[indice + 1] === '"') indice++;
      else entreComillas = !entreComillas;
    } else if (!entreComillas) {
      if (caracter === '\n' || caracter === '\r') break;
      if (Object.hasOwn(frecuencias, caracter)) frecuencias[caracter]++;
    }
  }
  return Object.keys(frecuencias).sort((primero, segundo) => frecuencias[segundo] - frecuencias[primero])[0];
}
