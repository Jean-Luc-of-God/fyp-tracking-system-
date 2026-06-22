package rw.aauca.fyp.exception;

import rw.aauca.fyp.enums.StudentState;

public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(StudentState from, StudentState to) {
        super("Invalid transition: " + from + " -> " + to);
    }
}
