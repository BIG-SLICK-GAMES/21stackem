import { Redirect } from "expo-router";
import { stackemRoutes } from "../src/navigation/routes";

export default function GameScreen() {
  return <Redirect href={stackemRoutes.lobby} />;
}
