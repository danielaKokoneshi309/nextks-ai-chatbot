import { commonQuestions } from "@/constants/commonQuestions";
import styles from "./CommonQuestions.module.css";

interface Props {
  handleQuestionClick: (question: string) => void;
}

const CommonQuestions = ({ handleQuestionClick }: Props) => {
  return (
    <div className={styles.commonQuestions}>
      {commonQuestions.map((question, index) => (
        <button
          key={index}
          type="button"
          className={styles.questionButton}
          onClick={() => handleQuestionClick(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
};

export default CommonQuestions;
