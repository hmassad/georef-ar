# georef-ar

[Servicio de normalización de datos geográficos](https://datos.gob.ar/dataset/modernizacion-servicio-normalizacion-datos-geograficos)

[Vigilancia de Infecciones respiratorias agudas](https://datos.gob.ar/dataset/salud-vigilancia-infecciones-respiratorias-agudas)

## install and run

después de clonar, instalar dependencias con yarn

```bash
yarn install
```

correr la app con

```bash
node app.js
```

## API

### GET /geo

Devuelve todas las provincias y departamentos, con sus centroides

```js
{
    p: [ // provincias
        {
            id: string,
            n: string, // nombre
            g: { // centroide
                lat: float,
                lon: float
            }
            d: [ // departamentos
                {
                    id: string,
                    n: string, // nombre
                    g: { // centroide
                        lat: float,
                        lon: float
                    }
                }
            ]
        }
    ]
}
```

### GET /eti

```js
{
    p: [ // provincias
        {
            id: string,
            n: string, // nombre
            g: { // centroide
                lat: float,
                lon: float
            }
            d: [ // departamentos
                {
                    id: string,
                    n: string, // nombre
                    g: { // centroide
                        lat: float,
                        lon: float
                    },
                    c: [ // casos
                        {
                            y: string, // año
                            w: string, // semana empidemilógica
                            q: int // cantidad de casos
                        }
                    ]
                }
            ]
        }
    ]
}
```
