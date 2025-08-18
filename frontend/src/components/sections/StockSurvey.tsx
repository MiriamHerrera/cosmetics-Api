'use client';

import { Palette, Droplets, Brush, MessageSquare, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface SurveyOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  votes: number;
  isVoted: boolean;
}

interface StockSurveyProps {
  totalVotes?: number;
}

export default function StockSurvey({ totalVotes = 156 }: StockSurveyProps) {
  const [options, setOptions] = useState<SurveyOption[]>([
    {
      id: "1",
      name: "Paletas de Sombras Profesionales",
      icon: <Palette className="w-5 h-5 text-purple-600" />,
      votes: 70,
      isVoted: false
    },
    {
      id: "2", 
      name: "Productos de Skincare",
      icon: <Droplets className="w-5 h-5 text-pink-600" />,
      votes: 50,
      isVoted: false
    },
    {
      id: "3",
      name: "Set de Brochas Profesionales", 
      icon: <Brush className="w-5 h-5 text-pink-600" />,
      votes: 36,
      isVoted: false
    }
  ]);

  // Calcular porcentajes
  const calculatePercentage = (votes: number) => {
    return Math.round((votes / totalVotes) * 100);
  };

  // Función para votar
  const handleVote = (optionId: string) => {
    setOptions(prev => prev.map(option => 
      option.id === optionId 
        ? { 
            ...option, 
            votes: option.isVoted ? option.votes - 1 : option.votes + 1,
            isVoted: !option.isVoted 
          }
        : option
    ));
  };

  return (
    <section className="py-16" style={{
      backgroundColor: 'rgb(244 245 255)'
    }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la sección */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">
              ¡Tu Opinión Cuenta!
            </h2>
            <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
          </div>
        </div>

        {/* Encuesta principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100" style={{
          backgroundColor: '#aa94f7'
        }}>
          
          {/* Pregunta */}
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              ¿Qué productos te gustaría que incluyamos en el próximo inventario?
            </h3>
          </div>

          {/* Opciones de votación */}
          <div className="space-y-6 mb-8">
            {options.map((option) => {
              const percentage = calculatePercentage(option.votes);
              
              return (
                <div key={option.id} className={`
                  bg-gray-50 rounded-xl p-4 sm:p-6
                  hover:bg-gray-100 transition-colors duration-200
                  cursor-pointer
                  ${option.isVoted ? 'ring-2 ring-rose-400 bg-rose-50' : ''}
                `}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="
                        w-10 h-10 bg-white rounded-lg
                        flex items-center justify-center
                        shadow-sm
                      ">
                        {option.icon}
                      </div>
                      <span className="
                        font-semibold text-gray-800
                        text-sm sm:text-base
                      ">
                        {option.name}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleVote(option.id)}
                      className={`
                        px-4 py-2 rounded-lg font-medium text-sm
                        transition-all duration-200
                        ${option.isVoted
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-white text-gray-700 hover:bg-rose-50 hover:text-rose-700 border border-gray-200'
                        }
                      `}
                    >
                      {option.isVoted ? 'Votado ✓' : 'Votar'}
                    </button>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>{option.votes} votos</span>
                      <span className="font-semibold text-rose-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-rose-400 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mensaje de agradecimiento */}
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm sm:text-base">
              ¡Gracias por participar! Tu voto nos ayuda a traer lo que más deseas.
            </p>
          </div>

          {/* Botón de sugerir producto */}
          <div className="text-center">
            <button className="
              bg-gradient-to-r from-rose-400 to-pink-500
              hover:from-rose-500 hover:to-pink-600
              text-white font-semibold
              px-8 py-4 rounded-xl
              transition-all duration-300
              transform hover:scale-105
              shadow-lg hover:shadow-xl
              flex items-center justify-center gap-3 mx-auto
            ">
              <MessageSquare className="w-5 h-5" />
              Sugerir otro producto
            </button>
          </div>
        </div>
      </div>
    </section>
  );
} 