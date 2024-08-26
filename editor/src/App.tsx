import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

export default function App() {
  return (
    <div className="p-6 flex min-h-screen flex-col gap-6">
      <h1 className="scroll-m-20 text-3xl text-center font-extrabold tracking-tight lg:text-5xl">
        Ultimate Railbound Solver
      </h1>
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Main</CardTitle>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6"></CardContent>
      </Card>
    </div>
  );
}
