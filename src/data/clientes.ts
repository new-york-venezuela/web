import type { ImageMetadata } from 'astro';
import logo_LogoExcelsiorGama from '../assets/clientes/LogoExcelsiorGama.jpg';
import logo_LogoFarmatodo from '../assets/clientes/LogoFarmatodo.png';
import logo_Kalea from '../assets/clientes/Kalea.png';
import logo_AutomercadosPlazas from '../assets/clientes/AutomercadosPlazas.png';
import logo_LogoUnicasa from '../assets/clientes/LogoUnicasa.jpg';
import logo_LogoParamo from '../assets/clientes/LogoParamo.png';
import logo_LogoRioVida from '../assets/clientes/LogoRioVida.png';
import logo_santarosa_2 from '../assets/clientes/santarosa-2.png';
import logo_santapaula from '../assets/clientes/santapaula.png';
import logo_LogoPlansuarez from '../assets/clientes/LogoPlansuarez.png';
import logo_AutomercadosLuvebras from '../assets/clientes/AutomercadosLuvebras.jpg';
import logo_minegocio_2 from '../assets/clientes/minegocio-2.png';
import logo_LaMuralla from '../assets/clientes/LaMuralla.jpeg';
import logo_FlorDeAltamira from '../assets/clientes/FlorDeAltamira.jpeg';
import logo_nancymar from '../assets/clientes/nancymar.png';
import logo_maraplus from '../assets/clientes/maraplus.png';
import logo_Fruteria_pomelos from '../assets/clientes/Fruteria-pomelos.png';
import logo_ananas_1 from '../assets/clientes/ananas-1.png';
import logo_mercato from '../assets/clientes/mercato.png';
import logo_superritz from '../assets/clientes/superritz.png';

// Puntos de venta donde ya se encuentran los productos New York.
// Los logos viven en src/assets/clientes/. Las reseñas solo incluyen datos
// verificados; cuando no hay información pública fiable, se omite.

export interface Cliente {
  nombre: string;
  logo: ImageMetadata; // importado desde src/assets/clientes/
  tipo: 'Cadena de supermercados' | 'Supermercado' | 'Farmacia' | 'Panadería' | 'Frutería' | 'Punto de venta';
  ciudad: string;
  resumen: string;
}

export const clientes: Cliente[] = [
  {
    nombre: 'Gama (Excelsior Gama)',
    logo: logo_LogoExcelsiorGama,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen:
      'Cadena fundada por Manuel da Gama, con el Automercado Excelsior Gama inaugurado en 1969. Opera sucursales de formato vecindario y el concepto "Plus" en el este de Caracas; en 2021 simplificó su marca a "Gama".',
  },
  {
    nombre: 'Farmatodo',
    logo: logo_LogoFarmatodo,
    tipo: 'Farmacia',
    ciudad: 'Caracas',
    resumen:
      'Cadena de farmacias de autoservicio de origen venezolano, con raíces en la Farmacia Lara de 1918. Combina medicinas, cuidado personal y productos de consumo diario.',
  },
  {
    nombre: 'Kalea',
    logo: logo_Kalea,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen:
      'Cadena nacida en Valencia en 2019 que abrió en La Trinidad su primera tienda en Caracas. Destaca por su sección de frutas y verduras, zona de café y cajas de autopago.',
  },
  {
    nombre: "Automercados Plaza's",
    logo: logo_AutomercadosPlazas,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen: 'Cadena familiar de supermercados con más de seis décadas de trayectoria en Venezuela.',
  },
  {
    nombre: 'Unicasa',
    logo: logo_LogoUnicasa,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen: 'Supermercados con sedes en zonas residenciales de Caracas como Cumbres de Curumo y La Candelaria.',
  },
  {
    nombre: 'Páramo Hipermercado',
    logo: logo_LogoParamo,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen: 'Hipermercado de Caracas, una de las cadenas que abastecemos de forma directa, tienda por tienda.',
  },
  {
    nombre: 'Río Vida Supermercados',
    logo: logo_LogoRioVida,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen: 'Cadena de supermercados de Caracas que forma parte de nuestra red de retail.',
  },
  {
    nombre: 'Automercado Santa Rosa',
    logo: logo_santarosa_2,
    tipo: 'Supermercado',
    ciudad: 'Caracas',
    resumen: 'Automercado independiente de compra diaria en Caracas.',
  },
  {
    nombre: 'Automercado Santa Paula',
    logo: logo_santapaula,
    tipo: 'Supermercado',
    ciudad: 'Caracas',
    resumen: 'Automercado independiente de compra diaria en Caracas.',
  },
  {
    nombre: 'Plan Suárez',
    logo: logo_LogoPlansuarez,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen: 'Cadena de supermercados de Caracas que forma parte de nuestra red de retail.',
  },
  {
    nombre: 'Automercados Luvebras',
    logo: logo_AutomercadosLuvebras,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen: 'Cadena de automercados de Caracas que forma parte de nuestra red de retail.',
  },
  {
    nombre: 'Mi Negocio',
    logo: logo_minegocio_2,
    tipo: 'Supermercado',
    ciudad: 'Caracas',
    resumen: 'Supermercado independiente en Caracas.',
  },
  {
    nombre: 'La Muralla',
    logo: logo_LaMuralla,
    tipo: 'Cadena de supermercados',
    ciudad: 'Caracas',
    resumen: 'Supermercado de Caracas que forma parte de nuestra red de retail.',
  },
  {
    nombre: 'Flor de Altamira',
    logo: logo_FlorDeAltamira,
    tipo: 'Punto de venta',
    ciudad: 'Caracas',
    resumen: 'Comercio independiente en la zona de Altamira, Caracas.',
  },
  {
    nombre: 'NancyMar',
    logo: logo_nancymar,
    tipo: 'Panadería',
    ciudad: 'Caracas',
    resumen: 'Panadería en Caracas que opera desde 1999.',
  },
  {
    nombre: 'Mara Plus Farmacia',
    logo: logo_maraplus,
    tipo: 'Farmacia',
    ciudad: 'Caracas',
    resumen: 'Farmacia independiente en Caracas.',
  },
  {
    nombre: 'Frutería Los Pomelos',
    logo: logo_Fruteria_pomelos,
    tipo: 'Frutería',
    ciudad: 'Caracas',
    resumen: 'Frutería en Caracas.',
  },
  {
    nombre: 'Ananas',
    logo: logo_ananas_1,
    tipo: 'Punto de venta',
    ciudad: 'Caracas',
    resumen: 'Tienda independiente en Caracas.',
  },
  {
    nombre: 'Mercato',
    logo: logo_mercato,
    tipo: 'Punto de venta',
    ciudad: 'Caracas',
    resumen: 'Tienda en Caracas.',
  },
  {
    nombre: 'Super Ritz 72',
    logo: logo_superritz,
    tipo: 'Supermercado',
    ciudad: 'Interior del país',
    resumen: 'Supermercado fuera del área metropolitana de Caracas.',
  },
];
