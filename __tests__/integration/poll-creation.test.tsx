import { render, screen } from "@testing-library/react";
import CreatePollPage from "../../app/polls/create/page";

describe("CreatePollPage", () => {
  it("renders without crashing", () => {
    render(<CreatePollPage />);
    expect(
      screen.getByRole("heading", { name: /create a new poll/i }),
    ).toBeInTheDocument();
  });
});
