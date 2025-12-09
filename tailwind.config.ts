import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			navy: {
  				'50': '#E8EBF0',
  				'100': '#C5CDD9',
  				'200': '#9FAFC2',
  				'300': '#7991AB',
  				'400': '#5C7A9A',
  				'500': '#3F6389',
  				'600': '#375981',
  				'700': '#2D4D76',
  				'800': '#24426C',
  				'900': '#0A1A2F',
  				'950': '#060F1A'
  			},
  			rail: {
  				orange: '#FF6A1A',
  				'orange-light': '#FF8A4A',
  				'orange-dark': '#E55A10'
  			},
  			surface: {
  				primary: '#FFFFFF',
  				secondary: '#F8FAFC',
  				tertiary: '#F1F5F9',
  				border: '#E2E8F0',
  				'border-light': '#F1F5F9'
  			},
  			text: {
  				primary: '#0F172A',
  				secondary: '#475569',
  				tertiary: '#94A3B8',
  				inverse: '#FFFFFF'
  			},
  			status: {
  				success: '#10B981',
  				warning: '#F59E0B',
  				error: '#EF4444',
  				info: '#3B82F6'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'SF Pro Display',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'display-xl': [
  				'4.5rem',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-0.02em'
  				}
  			],
  			'display-lg': [
  				'3.75rem',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-0.02em'
  				}
  			],
  			'display-md': [
  				'3rem',
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.02em'
  				}
  			],
  			'display-sm': [
  				'2.25rem',
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.01em'
  				}
  			],
  			'heading-xl': [
  				'1.875rem',
  				{
  					lineHeight: '1.3',
  					letterSpacing: '-0.01em'
  				}
  			],
  			'heading-lg': [
  				'1.5rem',
  				{
  					lineHeight: '1.4',
  					letterSpacing: '-0.01em'
  				}
  			],
  			'heading-md': [
  				'1.25rem',
  				{
  					lineHeight: '1.4'
  				}
  			],
  			'heading-sm': [
  				'1.125rem',
  				{
  					lineHeight: '1.5'
  				}
  			],
  			'body-lg': [
  				'1.125rem',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			'body-md': [
  				'1rem',
  				{
  					lineHeight: '1.6'
  				}
  			],
  			'body-sm': [
  				'0.875rem',
  				{
  					lineHeight: '1.5'
  				}
  			],
  			'caption': [
  				'0.75rem',
  				{
  					lineHeight: '1.4'
  				}
  			]
  		},
  		spacing: {
  			'4.5': '1.125rem',
  			'18': '4.5rem',
  			'22': '5.5rem',
  			'26': '6.5rem',
  			'30': '7.5rem'
  		},
  		borderRadius: {
  			'4xl': '2rem',
  			'5xl': '2.5rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			'premium-sm': '0 1px 2px 0 rgba(10, 26, 47, 0.05)',
  			'premium': '0 4px 6px -1px rgba(10, 26, 47, 0.07), 0 2px 4px -2px rgba(10, 26, 47, 0.05)',
  			'premium-md': '0 10px 15px -3px rgba(10, 26, 47, 0.08), 0 4px 6px -4px rgba(10, 26, 47, 0.05)',
  			'premium-lg': '0 20px 25px -5px rgba(10, 26, 47, 0.1), 0 8px 10px -6px rgba(10, 26, 47, 0.05)',
  			'premium-xl': '0 25px 50px -12px rgba(10, 26, 47, 0.15)',
  			'card': '0 1px 3px rgba(10, 26, 47, 0.04), 0 4px 12px rgba(10, 26, 47, 0.06)',
  			'card-hover': '0 4px 12px rgba(10, 26, 47, 0.08), 0 8px 24px rgba(10, 26, 47, 0.1)',
  			'button': '0 1px 2px rgba(10, 26, 47, 0.05), 0 2px 4px rgba(10, 26, 47, 0.05)',
  			'button-hover': '0 4px 8px rgba(10, 26, 47, 0.1), 0 2px 4px rgba(10, 26, 47, 0.06)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s ease-out',
  			'fade-up': 'fadeUp 0.4s ease-out',
  			'slide-in': 'slideIn 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			fadeUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(-10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			}
  		},
  		transitionDuration: {
  			'250': '250ms',
  			'350': '350ms'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
