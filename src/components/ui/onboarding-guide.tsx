'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  MessageCircle, 
  Settings, 
  Bookmark,
  Search,
  Plus,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingGuideProps {
  isVisible: boolean;
  steps: OnboardingStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  className?: string;
}

export function OnboardingGuide({
  isVisible,
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  className,
}: OnboardingGuideProps) {
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  React.useEffect(() => {
    if (!isVisible || !currentStepData?.target) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(currentStepData.target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const position = currentStepData.position || 'bottom';
      
      let x = rect.left + rect.width / 2;
      let y = rect.bottom + 10;
      
      switch (position) {
        case 'top':
          y = rect.top - 10;
          break;
        case 'left':
          x = rect.left - 10;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + 10;
          y = rect.top + rect.height / 2;
          break;
        case 'center':
          x = window.innerWidth / 2;
          y = window.innerHeight / 2;
          break;
      }
      
      setTooltipPosition({ x, y });
    }
  }, [isVisible, currentStep, currentStepData]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  if (!isVisible || !currentStepData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onSkip}
        />

        {/* Spotlight effect for target element */}
        {targetElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none"
            style={{
              left: targetElement.getBoundingClientRect().left - 8,
              top: targetElement.getBoundingClientRect().top - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('absolute max-w-sm', className)}
          style={{
            left: currentStepData.position === 'center' ? '50%' : tooltipPosition.x,
            top: currentStepData.position === 'center' ? '50%' : tooltipPosition.y,
            transform: currentStepData.position === 'center' ? 'translate(-50%, -50%)' : 
                      currentStepData.position === 'left' ? 'translate(-100%, -50%)' :
                      currentStepData.position === 'right' ? 'translate(0, -50%)' :
                      currentStepData.position === 'top' ? 'translate(-50%, -100%)' :
                      'translate(-50%, 0)',
          }}
        >
          <Card className="p-6 shadow-xl border-primary/20 bg-background/95 backdrop-blur">
            <div className="flex items-start gap-3 mb-4">
              {currentStepData.icon && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {currentStepData.icon}
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="flex-shrink-0 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {currentStepData.action && (
              <div className="mb-4">
                <Button
                  onClick={currentStepData.action.onClick}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {currentStepData.action.label}
                </Button>
              </div>
            )}

            {/* Progress indicator */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <motion.div
                  className="bg-primary h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                >
                  Skip Tour
                </Button>
                
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  {!isLastStep && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Predefined onboarding tours
export const chatOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Career Counseling Chat!',
    description: 'Let me show you around and help you get the most out of your AI career counselor.',
    position: 'center',
    icon: <Lightbulb className="w-4 h-4 text-primary" />,
  },
  {
    id: 'chat-input',
    title: 'Start a Conversation',
    description: 'Type your career questions here. Ask about job searches, career changes, skill development, or any professional guidance you need.',
    target: '[data-onboarding="chat-input"]',
    position: 'top',
    icon: <MessageCircle className="w-4 h-4 text-primary" />,
  },
  {
    id: 'new-chat',
    title: 'Create New Chats',
    description: 'Start fresh conversations for different topics. Each chat maintains its own context and history.',
    target: '[data-onboarding="new-chat"]',
    position: 'right',
    icon: <Plus className="w-4 h-4 text-primary" />,
  },
  {
    id: 'chat-history',
    title: 'Access Your History',
    description: 'All your conversations are saved here. Click on any chat to continue where you left off.',
    target: '[data-onboarding="chat-sidebar"]',
    position: 'right',
    icon: <Search className="w-4 h-4 text-primary" />,
  },
  {
    id: 'message-actions',
    title: 'Interact with Messages',
    description: 'Copy helpful responses, bookmark important advice, or give feedback to improve your experience.',
    target: '[data-onboarding="message-actions"]',
    position: 'left',
    icon: <Bookmark className="w-4 h-4 text-primary" />,
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Adjust themes, notifications, and other preferences to make the app work best for you.',
    target: '[data-onboarding="user-menu"]',
    position: 'bottom',
    icon: <Settings className="w-4 h-4 text-primary" />,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start exploring your career possibilities. Remember, I\'m here to help you succeed in your professional journey.',
    position: 'center',
    icon: <Target className="w-4 h-4 text-primary" />,
  },
];

// Hook for managing onboarding state
export function useOnboarding(steps: OnboardingStep[]) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = React.useState(false);

  React.useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboarding-completed');
    if (completed) {
      setHasCompletedOnboarding(true);
    }
  }, []);

  const startOnboarding = React.useCallback(() => {
    setCurrentStep(0);
    setIsVisible(true);
  }, []);

  const nextStep = React.useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const previousStep = React.useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipOnboarding = React.useCallback(() => {
    setIsVisible(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding-completed', 'true');
  }, []);

  const completeOnboarding = React.useCallback(() => {
    setIsVisible(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding-completed', 'true');
  }, []);

  const resetOnboarding = React.useCallback(() => {
    localStorage.removeItem('onboarding-completed');
    setHasCompletedOnboarding(false);
    setCurrentStep(0);
  }, []);

  return {
    isVisible,
    currentStep,
    hasCompletedOnboarding,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
}

// Quick help tooltip component
interface QuickHelpProps {
  children: React.ReactNode;
  title: string;
  description: string;
  shortcut?: string;
  className?: string;
}

export function QuickHelp({ 
  children, 
  title, 
  description, 
  shortcut, 
  className 
}: QuickHelpProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div 
      className={cn('relative', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <Card className="p-3 max-w-xs shadow-lg border-primary/20 bg-background/95 backdrop-blur">
              <div className="text-sm font-medium mb-1">{title}</div>
              <div className="text-xs text-muted-foreground mb-2">{description}</div>
              {shortcut && (
                <div className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">
                  {shortcut}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}