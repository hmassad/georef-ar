# georef-ar

[Dataset de datos geográficos normalizados, Ministerio de Modernización](https://datos.gob.ar/dataset/modernizacion-servicio-normalizacion-datos-geograficos)

[Dataset de Vigilancia de Infecciones respiratorias agudas, Ministerio de Modernización](https://datos.gob.ar/dataset/salud-vigilancia-infecciones-respiratorias-agudas)

[Proyecciones y estimaciones de Población por departamento, INDEC](https://www.indec.gob.ar/indec/web/Nivel4-Tema-2-24-119)

## install and run

después de clonar, instalar dependencias con yarn

```bash
yarn install
```

correr la app con

```bash
yarn start
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

### GET /pop

Devuelve las proyecciones de población por año y por departamento

```js
[
    {
        id: string, // id del departamento
        p: [ // población
            {
                y: string, // año
                p: int, // cantidad de habitantes
            }
        ]
    }
]
```

### GET /eti

Devuelve las provincias, departamentos y casos históricos

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
                            q: int, // cantidad de casos
                            p: int, // población
                            r: float // casos cada 10.000
                        }
                    ]
                }
            ]
        }
    ]
}
```

## Artículos que respaldan los hallazgos

Catamarca 29/8/2018

https://www.elancasti.com.ar/info-gral/2018/8/29/bloqueos-de-gripe-h1n1-en-santa-maria-381101.html
