import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface QuizViewProps {
  quizId: string;
  moduleTitle?: string;
  isFinal?: boolean;
  passingScore: number;
  onClose: () => void;
}

export default function QuizView({ quizId, moduleTitle, isFinal, passingScore, onClose }: QuizViewProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["quiz-questions", quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No questions available for this quiz.</p>
        <Button variant="outline" className="mt-4" onClick={onClose}>Go Back</Button>
      </div>
    );
  }

  const question = questions[currentQ];
  const options = question.options as string[];
  const totalQuestions = questions.length;

  const handleSelect = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedOption(optionIndex);
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    setAnswers({ ...answers, [currentQ]: selectedOption });
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    const correctCount = questions.reduce((count: number, q: any, i: number) => {
      return count + (answers[i] === q.correct_index ? 1 : 0);
    }, 0);
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercent >= passingScore;

    return (
      <div className="text-center py-8 space-y-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${passed ? "bg-emerald-100 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
          {passed ? <Trophy className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {passed ? "🎉 Quiz Passed!" : "Quiz Not Passed"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isFinal ? "Final Exam" : `Module Quiz: ${moduleTitle}`}
          </p>
        </div>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{scorePercent}%</p>
            <p className="text-xs text-muted-foreground">Your Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-muted-foreground">{passingScore}%</p>
            <p className="text-xs text-muted-foreground">Passing Score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{correctCount}/{totalQuestions}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center pt-4">
          {!passed && (
            <Button variant="outline" onClick={() => {
              setCurrentQ(0);
              setAnswers({});
              setSubmitted(false);
              setSelectedOption(null);
              setShowFeedback(false);
            }}>
              <RotateCcw className="mr-1 h-4 w-4" /> Retry Quiz
            </Button>
          )}
          <Button onClick={onClose}>
            {passed ? "Continue Course" : "Back to Lessons"}
          </Button>
        </div>
      </div>
    );
  }

  const isCorrect = showFeedback && selectedOption === question.correct_index;
  const isWrong = showFeedback && selectedOption !== question.correct_index;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {isFinal ? "Final Exam" : `Module Quiz: ${moduleTitle}`}
        </span>
        <span className="text-xs text-muted-foreground">
          Question {currentQ + 1} of {totalQuestions}
        </span>
      </div>
      <Progress value={((currentQ + 1) / totalQuestions) * 100} className="h-2" />

      <h3 className="text-lg font-semibold text-foreground leading-snug">{question.question}</h3>

      <div className="space-y-3">
        {options.map((option: string, oi: number) => {
          let borderClass = "border-border hover:border-primary/50 hover:bg-primary/5";
          if (showFeedback) {
            if (oi === question.correct_index) borderClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20";
            else if (oi === selectedOption) borderClass = "border-destructive bg-destructive/5";
            else borderClass = "border-border opacity-50";
          } else if (selectedOption === oi) {
            borderClass = "border-primary bg-primary/5 ring-2 ring-primary/20";
          }

          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              disabled={showFeedback}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm ${borderClass}`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold
                  ${showFeedback && oi === question.correct_index ? "border-emerald-500 bg-emerald-500 text-white" : ""}
                  ${showFeedback && oi === selectedOption && oi !== question.correct_index ? "border-destructive bg-destructive text-white" : ""}
                  ${!showFeedback && selectedOption === oi ? "border-primary bg-primary text-primary-foreground" : ""}
                  ${!showFeedback && selectedOption !== oi ? "border-muted-foreground/30" : ""}
                `}>
                  {showFeedback && oi === question.correct_index ? <CheckCircle className="h-4 w-4" /> :
                   showFeedback && oi === selectedOption ? <XCircle className="h-4 w-4" /> :
                   String.fromCharCode(65 + oi)}
                </span>
                <span className="text-foreground">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {!showFeedback ? (
          <Button onClick={handleConfirm} disabled={selectedOption === null}>
            Confirm Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentQ < totalQuestions - 1 ? (
              <>Next Question <ArrowRight className="ml-1 h-4 w-4" /></>
            ) : "See Results"}
          </Button>
        )}
      </div>

      {showFeedback && (
        <div className={`p-4 rounded-xl text-sm ${isCorrect ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" : "bg-destructive/5 border border-destructive/20"}`}>
          <p className={`font-medium ${isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
            {isCorrect ? "✓ Correct!" : `✗ Incorrect. The correct answer is: ${options[question.correct_index]}`}
          </p>
        </div>
      )}
    </div>
  );
}