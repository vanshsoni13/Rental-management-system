import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ShieldCheck, Clock, Layers, ArrowRight, CheckCircle2, Sparkles, Search } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [recommendationStrategy, setRecommendationStrategy] = useState('');
  const [frequentlyRented, setFrequentlyRented] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products')
        ]);
        setCategories(catRes.data.categories || []);
        setFeaturedProducts((prodRes.data.products || []).slice(0, 4));

        const [recommendationResult, popularResult] = await Promise.allSettled([
          api.get('/ai/recommendations', { params: { limit: 4 } }),
          api.get('/ai/frequently-rented', { params: { limit: 4 } })
        ]);
        let recommendations = [];
        let popularProducts = [];
        if (recommendationResult.status === 'fulfilled') {
          recommendations = recommendationResult.value.data.recommendations || [];
          setRecommendationStrategy(recommendationResult.value.data.strategy || '');
        } else {
          console.error('Error loading AI recommendations:', recommendationResult.reason);
        }
        if (popularResult.status === 'fulfilled') {
          popularProducts = popularResult.value.data.products || [];
          setFrequentlyRented(popularProducts);
        } else {
          console.error('Error loading frequently rented products:', popularResult.reason);
        }

        const topRentedProduct = popularProducts[0];
        if (topRentedProduct) {
          const topProductId = String(topRentedProduct.product_id);
          const topRecommendation = recommendations.find(
            (product) => String(product.product_id) === topProductId
          ) || topRentedProduct;
          recommendations = [
            { ...topRecommendation, recommendation_reason: 'Top rented product' },
            ...recommendations.filter((product) => String(product.product_id) !== topProductId)
          ].slice(0, 4);
          if (recommendationResult.status === 'rejected') {
            setRecommendationStrategy('popular_catalog');
          }
        }
        setAiRecommendations(recommendations);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative bg-[var(--ink)] text-white min-h-[470px] overflow-hidden p-7 sm:p-12 lg:p-16">
        <div className="absolute inset-y-0 right-0 w-[44%] hidden lg:block border-l border-white/10">
          <div className="absolute inset-0 opacity-20" style={{backgroundImage:'linear-gradient(90deg, transparent 49.5%, rgba(255,255,255,.25) 50%, transparent 50.5%), linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px)',backgroundSize:'80px 80px'}}></div>
          <div className="absolute right-10 top-12 w-52 h-52 border border-[#d8b25c]/50 rotate-12"></div>
          <div className="absolute right-28 bottom-14 w-32 h-32 bg-[var(--rust)] rotate-[-8deg]"></div>
        </div>

        <div className="max-w-2xl relative z-10 pt-3">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-10 h-px bg-[var(--gold)]"></span>
            <span className="text-[10px] font-black uppercase tracking-[.24em] text-[#ddd3b8]">Rent · Discover · Use · Return</span>
          </div>

          <h1 className="text-[46px] sm:text-[64px] lg:text-[76px] font-black tracking-[-0.065em] leading-[0.92] mb-7">
            Good gear.<br /><span className="text-[var(--rust)]">Less waste.</span>
          </h1>

          <p className="text-[#cbd2c9] text-base sm:text-lg max-w-xl leading-relaxed mb-9">
            High-grade cameras, tools, audio gear, and equipment—ready when the project is.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/products"
              className="bg-[var(--rust)] hover:bg-[#df7358] text-white font-black px-7 py-4 text-xs uppercase tracking-[.16em] flex items-center justify-center gap-3"
            >
              <span>Explore the catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!authLoading && !isAuthenticated && (
              <Link
                to="/login"
                className="border border-white/25 hover:border-white/60 text-white font-black px-7 py-4 text-xs uppercase tracking-[.16em] flex items-center justify-center"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Flexible Duration Rates</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Rent by the Hour, Day, Week, Month, or Year. Tiered automatic pricing calculations.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Zero Overbooking</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Transactional date-range checking guarantees real-time stock reservation.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Instant Returns Desk</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Automated return processing, condition inspection, and transparent late fee calculation.</p>
          </div>
        </div>
      </section>

      {/* Catalog Search */}
      <section className="bg-[var(--white)] p-6 sm:p-8 border-l-4 border-[var(--rust)] border-y border-r border-[var(--line)]">
        <div className="max-w-4xl">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <h2 className="text-2xl font-black text-[var(--ink)]">Find a rental</h2>
            <span className="hidden sm:block text-[10px] uppercase tracking-[.18em] text-[var(--ink-soft)]">Live catalog</span>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="homepage-product-search" className="sr-only">Search rental products</label>
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3" />
              <input
                id="homepage-product-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Try cameras, tools, speakers, bikes..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl transition text-sm shadow-sm"
            >
              Search Catalog
            </button>
          </form>
        </div>
      </section>

      {/* Categories Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Browse Categories</h2>
            <p className="text-sm text-gray-500">Find the exact category of gear you need</p>
          </div>
          <Link to="/products" className="text-sky-600 hover:text-sky-700 font-semibold text-sm flex items-center">
            <span>View All</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                to={`/products?category_id=${cat.category_id}`}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition text-center group flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-600 mb-3 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition overflow-hidden">
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-gray-900 text-xs line-clamp-1 group-hover:text-sky-600 transition">{cat.name}</h4>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Featured Rental Items</h2>
            <p className="text-sm text-gray-500">Popular items ready for instant booking</p>
          </div>
          <Link to="/products" className="text-sky-600 hover:text-sky-700 font-semibold text-sm flex items-center">
            <span>See Full Catalog</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </section>

      {!loading && aiRecommendations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 text-violet-600 mr-2" />
                {recommendationStrategy === 'personalized_content_similarity'
                  ? 'AI Picks for You'
                  : 'AI Picks to Explore'}
              </h2>
              <p className="text-sm text-gray-500">
                {recommendationStrategy === 'personalized_content_similarity'
                  ? 'Based on your rental history and similar catalog items'
                  : recommendationStrategy === 'popular_catalog'
                    ? 'Popular items based on approved, active, and completed rentals'
                    : 'Suggestions from the active catalog while rental history builds'}
              </p>
            </div>
            <Link to="/products" className="text-sky-600 hover:text-sky-700 font-semibold text-sm flex items-center">
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiRecommendations.map((product) => (
              <div key={product.product_id}>
                <p className="text-xs font-semibold text-violet-700 mb-2">
                  {product.recommendation_reason}
                </p>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Local TF-IDF content similarity; recommendations are generated by this app and are not sent to an external AI service.
          </p>
        </section>
      )}

      {!loading && frequentlyRented.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Frequently Rented</h2>
              <p className="text-sm text-gray-500">Popular active items ranked like the rental report</p>
            </div>
            <Link to="/products" className="text-sky-600 hover:text-sky-700 font-semibold text-sm flex items-center">
              <span>Browse Catalog</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {frequentlyRented.map((product) => (
              <div key={product.product_id}>
                <p className="text-xs font-semibold text-emerald-700 mb-2">
                  {product.rental_count} {product.rental_count === 1 ? 'rental' : 'rentals'}
                </p>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How It Works Steps */}
      <section className="bg-sky-900 text-white rounded-3xl p-8 sm:p-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black mb-2">How Rental Flow Works</h2>
          <p className="text-sky-200 text-sm">Four easy steps from selection to return</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="bg-sky-800/50 p-6 rounded-2xl border border-sky-700/50 backdrop-blur-sm">
            <div className="w-10 h-10 bg-sky-500 text-white font-black rounded-xl flex items-center justify-center mx-auto mb-4 text-lg">1</div>
            <h4 className="font-bold text-base mb-1">Select Item</h4>
            <p className="text-xs text-sky-200">Browse inventory and choose equipment.</p>
          </div>

          <div className="bg-sky-800/50 p-6 rounded-2xl border border-sky-700/50 backdrop-blur-sm">
            <div className="w-10 h-10 bg-sky-500 text-white font-black rounded-xl flex items-center justify-center mx-auto mb-4 text-lg">2</div>
            <h4 className="font-bold text-base mb-1">Select Dates</h4>
            <p className="text-xs text-sky-200">Check availability and duration prices.</p>
          </div>

          <div className="bg-sky-800/50 p-6 rounded-2xl border border-sky-700/50 backdrop-blur-sm">
            <div className="w-10 h-10 bg-sky-500 text-white font-black rounded-xl flex items-center justify-center mx-auto mb-4 text-lg">3</div>
            <h4 className="font-bold text-base mb-1">Book & Pay</h4>
            <p className="text-xs text-sky-200">Reserve quantity and process payment.</p>
          </div>

          <div className="bg-sky-800/50 p-6 rounded-2xl border border-sky-700/50 backdrop-blur-sm">
            <div className="w-10 h-10 bg-sky-500 text-white font-black rounded-xl flex items-center justify-center mx-auto mb-4 text-lg">4</div>
            <h4 className="font-bold text-base mb-1">Use & Return</h4>
            <p className="text-xs text-sky-200">Enjoy equipment and return on schedule.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
