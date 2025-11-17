# Scripts de Debug - SmartFlow Mobile

Esta carpeta contiene scripts de utilidad para consultar y manipular datos en la base de datos MongoDB.

## Estructura

```
scripts/
├── usuarios/
│   └── consultarUsuarios.js       # Listar todos los usuarios
├── especialidades/
│   └── consultarEspecialidades.js # Listar especialidades
├── citas/
│   └── consultarCitas.js          # Listar citas
└── README.md
```

## Uso

Ejecuta los scripts desde la raíz del proyecto:

```bash
# Ver usuarios
node src/modules/mobile/scripts/usuarios/consultarUsuarios.js

# Ver especialidades
node src/modules/mobile/scripts/especialidades/consultarEspecialidades.js

# Ver citas
node src/modules/mobile/scripts/citas/consultarCitas.js
```

## Notas

- Asegúrate de tener el archivo `.env` configurado con `MONGO_URI`
- Los scripts se conectan y desconectan automáticamente de MongoDB
- Útiles para debugging y verificación de datos de prueba
