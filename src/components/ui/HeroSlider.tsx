// Importa hooks de React para estado y efectos
import { useState, useEffect, useCallback } from 'react';
// Importa íconos para navegación del slider
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Interfaz para los datos de cada banner
interface Banner {
  banner_id: number;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  orden: number;
  activo: boolean;
}

// URL base de la API
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

// Componente principal HeroSlider
export default function HeroSlider() {
  // Estado para los banners
  const [banners, setBanners] = useState<Banner[]>([]);
  // Estado para el índice actual del slider
  const [currentIndex, setCurrentIndex] = useState(0);
  // Estado para saber si el mouse está sobre el slider
  const [isHovered, setIsHovered] = useState(false);
  // Estado de carga
  const [loading, setLoading] = useState(true);

  // Efecto para cargar banners desde la API al montar
  useEffect(() => {
    const cargarBanners = async () => {
      try {
        const response = await fetch(`${API_URL}/banners`);
        if (response.ok) {
          const data = await response.json();
          setBanners(data); // Guarda banners en estado
        }
      } catch (error) {
        // Error silencioso
      } finally {
        setLoading(false); // Oculta spinner
      }
    };
    cargarBanners();
  }, []);

  // Total de slides
  const totalSlides = banners.length;

  // Función para ir al siguiente slide
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Función para ir al slide anterior
  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Función para ir a un slide específico
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Efecto para auto-slide cada 3 segundos si no está el mouse encima
  useEffect(() => {
    if (!isHovered && totalSlides > 0) {
      const interval = setInterval(nextSlide, 3000);
      return () => clearInterval(interval);
    }
  }, [isHovered, nextSlide, totalSlides]);

  // Si está cargando, muestra spinner
  if (loading) {
    return (
      <section className="relative w-screen overflow-hidden bg-gray-100 h-[320px] md:h-[600px]">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Cargando banners...</p>
        </div>
      </section>
    );
  }

  // Banners locales para mostrar mientras no haya banners configurados en la API
  if (banners.length === 0) {
    return (
      <section 
        className="relative w-screen overflow-hidden bg-[#090909] h-[440px] md:h-[650px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}vw)` }}>
          <div className="min-w-full h-full flex-shrink-0">
            <div className="max-w-7xl mx-auto px-6 md:px-12 h-full relative z-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(168,118,62,0.3),transparent_38%)]" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
                <div className="relative text-center md:text-left order-2 md:order-1">
                  <p className="text-[#c68b52] font-bold uppercase tracking-[0.3em] text-xs md:text-sm mb-5">Prime Suplementos</p>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-5 leading-[0.95] uppercase">
                    Potenciá tu
                    <span className="block text-[#c68b52]">rendimiento</span>
                  </h1>
                  <p className="text-base md:text-xl text-white/65 max-w-lg mb-8">Suplementación de calidad para acompañar cada objetivo.</p>
                  <a href="/productos" className="inline-block bg-[#a8763e] hover:bg-[#c68b52] text-white px-7 py-3 rounded-sm font-bold uppercase tracking-wider transition-colors">Ver productos</a>
                </div>
                <div className="order-1 md:order-2 relative flex justify-center items-center">
                  <img src="/images/ShakerHeader%20.png" alt="Shaker de proteína" className="relative z-10 w-56 h-56 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Renderiza el slider de banners
  return (
    <section 
      className="relative w-screen overflow-hidden bg-amber-500 h-[320px] md:h-[600px] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
      style={{ left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wrapper del slider, mueve los banners según el índice */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}vw)` }}
      >
        {/* Renderiza cada banner */}
        {banners.map((banner) => (
          <div key={banner.banner_id} className="min-w-screen flex-shrink-0 h-full">
            <img
              src={banner.imagen_url}
              alt={banner.titulo || 'Banner'}
              className="w-screen h-full object-contain md:object-cover md:object-center"
              style={{objectPosition: 'center top'}}
            />
          </div>
        ))}
      </div>

      {/* Difuminado inferior blanco para efecto visual */}

      {/* Botón para ir al slide anterior */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 
                   bg-white/70 hover:bg-white rounded-full p-2 
                   transition-all duration-200 shadow-md hover:shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>

      {/* Botón para ir al slide siguiente */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 
                   bg-white/70 hover:bg-white rounded-full p-2 
                   transition-all duration-200 shadow-md hover:shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>
      
    </section>
  );
}
