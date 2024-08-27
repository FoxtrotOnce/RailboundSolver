import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import Canvas from "./Canvas";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen gap-6 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-center scroll-m-20 lg:text-5xl">
        Ultimate Railbound Solver
      </h1>
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Main</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1">
          <Canvas />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6"></CardContent>
      </Card>
    </div>
  );
}
