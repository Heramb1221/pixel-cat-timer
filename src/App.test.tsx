import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  window.localStorage.clear();
});

test("renders the settings screen on initial load", () => {
  render(<App />);
  expect(screen.getByText(/kitty timer/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
});

test("focus and break selectors are accessible via their labels", () => {
  render(<App />);
  expect(screen.getByLabelText(/focus/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/break/i)).toBeInTheDocument();
});

test("starting the timer switches to the focus timer view", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /start/i }));

  expect(screen.getByText(/focus/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /pause timer/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /stop timer/i })).toBeInTheDocument();
});

test("stopping the timer returns to the settings screen", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /start/i }));
  fireEvent.click(screen.getByRole("button", { name: /stop timer/i }));

  expect(screen.getByText(/kitty timer/i)).toBeInTheDocument();
});
