'use client';

import { useEffect, useRef, useState } from 'react';

import {
  ArrowRight,
  BookOpen,
  Feather,
  Globe,
  Heart,
  MessageCircle,
  Pen,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import ConnectButton from './components/LoginButton';

// Add interface for trending novel
interface TrendingNovel {
  id: string;
  title: string;
  authorName: string;
  preview: string;
}

const Homepage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [trendingNovels, setTrendingNovels] = useState<TrendingNovel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const connectButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    fetchTrendingNovels();
  }, []);

  const fetchTrendingNovels = async () => {
    try {
      const response = await fetch('/api/novels/trending');
      if (response.ok) {
        const novels = await response.json();
        setTrendingNovels(novels);
      } else {
        console.error('Failed to fetch trending novels');
      }
    } catch (error) {
      console.error('Error fetching trending novels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWriting = () => {
    if (session) {
      router.push('/dashboard');
    } else {
      if (connectButtonRef.current) {
        const button = connectButtonRef.current.querySelector('button');
        if (button) {
          button.click();
        }
      }
    }
  };

  const handleExploreStories = () => {
    router.push('/community');
  };

  const handleReadNovel = (novelId: string) => {
    router.push(`/explore/${novelId}`);
  };

  const features = [
    {
      icon: <Pen className="h-8 w-8" />,
      title: 'Write Freely',
      description: 'Create captivating fanfiction with our intuitive editor',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Get Feedback',
      description: 'Receive real-time comments and suggestions from readers',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Share Publicly',
      description: 'Build your audience and connect with fellow writers',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="featherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-pink-500/20 to-violet-500/20 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-500/15 blur-2xl" />
        <div className="absolute bottom-1/4 left-1/4 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-3xl" />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        <div
          className="absolute top-1/4 left-1/3 h-2 w-2 animate-ping rounded-full bg-white/20"
          style={{ animationDelay: '0s', animationDuration: '3s' }}
        />
        <div
          className="absolute top-1/2 right-1/4 h-2 w-2 animate-ping rounded-full bg-white/20"
          style={{ animationDelay: '1s', animationDuration: '4s' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 h-2 w-2 animate-ping rounded-full bg-white/20"
          style={{ animationDelay: '2s', animationDuration: '5s' }}
        />
        <div
          className="absolute top-3/4 right-1/3 h-2 w-2 animate-ping rounded-full bg-white/20"
          style={{ animationDelay: '3s', animationDuration: '3.5s' }}
        />
      </div>

      {/* Hero Section - no top padding needed since navbar overlays */}
      <div className="relative z-40 mx-auto max-w-7xl px-6 pt-20 pb-32">
        <div
          className={`transform text-center transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        >
          <div className="my-8 inline-flex items-center space-x-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium text-white/90">Where Stories Come Alive</span>
          </div>

          <h1 className="mb-8 text-6xl leading-tight font-bold md:text-8xl">
            <span className="animate-pulse bg-gradient-to-r from-pink-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Create
            </span>
            <br />
            <span className="text-white">Share</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
              Inspire
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-white/80 md:text-2xl">
            The ultimate platform for fanfiction writers to craft incredible stories, receive
            instant feedback, and build a community of passionate readers.
          </p>

          <div className="mb-16 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <button
              onClick={handleStartWriting}
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-12 py-5 text-xl font-bold text-white shadow-2xl shadow-pink-500/30 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center space-x-3">
                <Pen className="h-6 w-6" />
                <span>Start Writing</span>
                <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>

            <button
              onClick={handleExploreStories}
              className="flex items-center space-x-3 rounded-full border-2 border-white/30 bg-white/10 px-12 py-5 text-xl font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
            >
              <BookOpen className="h-6 w-6" />
              <span>Explore Stories</span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20 grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group hover-shadow-violet-500/20 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:bg-white/10 hover:shadow-2xl ${
                activeFeature === index ? 'ring-2 ring-violet-400' : ''
              }`}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <div className="mb-6 text-violet-400 transition-transform duration-300 group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">{feature.title}</h3>
              <p className="text-lg leading-relaxed text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Trending Stories */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-8 flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <h2 className="text-3xl font-bold text-white">Trending Now</h2>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="mb-2 h-6 rounded bg-white/10"></div>
                  <div className="mb-4 h-4 w-1/2 rounded bg-white/10"></div>
                  <div className="h-16 rounded bg-white/10"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {trendingNovels.map((novel, index) => (
                <div
                  key={novel.id}
                  className="group cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:scale-105 hover:bg-white/10"
                  onClick={() => handleReadNovel(novel.id)}
                >
                  <h3 className="mb-2 text-xl font-bold text-white transition-colors duration-300 group-hover:text-violet-400">
                    {novel.title}
                  </h3>
                  <p className="mb-4 text-white/60">by {novel.authorName}</p>
                  <p className="mb-4 text-sm leading-relaxed text-white/70">{novel.preview}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-white/50">
                      <div className="flex items-center space-x-2">
                        <Heart className="h-5 w-5 text-pink-400" />
                        <span>{(1500 + index * 200).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5 text-blue-400" />
                        <span>{89 + index * 15}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-violet-400">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-sm">Read</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="inline-block rounded-3xl bg-gradient-to-r from-pink-500 to-violet-500 p-1">
            <div className="rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-900 px-12 py-12">
              <Star className="slow mx-auto mb-6 h-16 w-16 animate-spin text-yellow-400" />
              <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
                Ready to Begin Your Journey?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-white/80">
                Join thousands of writers who are already crafting amazing stories and building
                their audience on ZoraPad.
              </p>
              <button
                onClick={handleStartWriting}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-16 py-6 text-2xl font-bold text-white shadow-2xl shadow-pink-500/30 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10 flex items-center space-x-3">
                  <span>Get Started Free</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden ConnectButton for programmatic triggering */}
      {!session && (
        <div
          ref={connectButtonRef}
          className="pointer-events-none fixed top-0 left-0 -z-10 opacity-0"
        >
          <ConnectButton className="[&>div>button]:opacity-0" />
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-40 mt-20 border-t border-white/10 bg-black/20 py-12 backdrop-blur-sm">
        <div className="w-full px-6 text-center">
          <div className="mb-6 flex items-center justify-center space-x-4">
            <Feather
              className="h-10 w-10 drop-shadow-lg"
              strokeWidth={1.5}
              style={{
                stroke: 'url(#featherGradient)',
                filter:
                  'drop-shadow(0 0 10px rgba(244, 114, 182, 0.8)) drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))',
              }}
            />
            <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-2xl font-bold text-transparent">
              ZoraPad
            </span>
          </div>
          <p className="text-lg text-white/60">
            Empowering writers, inspiring readers, building communities.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
