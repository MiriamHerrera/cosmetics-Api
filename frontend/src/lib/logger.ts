// Sistema de logging centralizado para la aplicación
export interface LoggerConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  showTimestamp: boolean;
  showModule: boolean;
}

class Logger {
  private config: LoggerConfig;
  private module: string;

  constructor(module: string, config?: Partial<LoggerConfig>) {
    this.module = module;
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      level: 'info',
      showTimestamp: false,
      showModule: true,
      ...config
    };
  }

  private shouldLog(level: string): boolean {
    if (!this.config.enabled) return false;
    
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.config.level);
    const messageLevel = levels.indexOf(level);
    
    return messageLevel >= currentLevel;
  }

  private formatMessage(level: string, message: string): string {
    const parts: string[] = [];
    
    if (this.config.showTimestamp) {
      parts.push(new Date().toISOString());
    }
    
    if (this.config.showModule) {
      parts.push(`[${this.module}]`);
    }
    
    const prefix = level === 'error' ? '❌' : 
                  level === 'warn' ? '⚠️' : 
                  level === 'info' ? '🔄' : '🔍';
    
    parts.push(`${prefix} ${message}`);
    
    return parts.join(' ');
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  // Método para cambiar configuración en tiempo de ejecución
  setConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Método para habilitar/deshabilitar logging
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Función helper para crear loggers
export const createLogger = (module: string, config?: Partial<LoggerConfig>): Logger => {
  return new Logger(module, config);
};

// Configuración global de logging
export const setGlobalLogLevel = (level: LoggerConfig['level']): void => {
  // Esta función se puede usar para cambiar el nivel de logging globalmente
  console.log(`🔧 [Logger] Nivel de logging global cambiado a: ${level}`);
};

// Configuración para diferentes entornos
export const getLoggerConfig = (): LoggerConfig => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case 'development':
      return {
        enabled: true,
        level: 'info',
        showTimestamp: false,
        showModule: true
      };
    case 'production':
      return {
        enabled: false,
        level: 'error',
        showTimestamp: false,
        showModule: false
      };
    default:
      return {
        enabled: true,
        level: 'warn',
        showTimestamp: false,
        showModule: true
      };
  }
};

export default Logger;
