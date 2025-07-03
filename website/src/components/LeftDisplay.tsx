import { Info, Settings } from "lucide-react";
import React from "react";
import { useGuiStore } from "../store";
import { SolveLevelDisplay } from "./SolveLevelDisplay";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const LeftDisplay: React.FC = () => {
  const { setHyperparams, defaultHyperparams, hyperparameters } = useGuiStore();

  return (
    <TooltipProvider>
      <div className="absolute flex flex-col inset-3 right-0 gap-4 overflow-auto">
        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">
              RailboundSolver
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              RailboundSolver is a logic-based solving algorithm designed to
              find the "best" solution that{" "}
              <Badge variant="secondary" className="mx-1">
                uses the least tracks
              </Badge>{" "}
              for any level configuration from the game{" "}
              <a
                href="https://store.steampowered.com/app/1967510/Railbound/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Railbound
              </a>
              .
            </CardDescription>
          </CardContent>
        </Card>

        {/* Solve Level Display - moved from absolute positioning */}
        <div className="relative">
          <SolveLevelDisplay />
        </div>
        {/* Advanced Hyperparameters Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Advanced Settings</CardTitle>
            </div>
            <CardDescription>
              Solver algorithm configuration options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>
                These settings affect the solving algorithm. The defaults are
                ideal for nearly any level, so only change them if you know what
                you are doing and it is absolutely necessary!
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {/* HEATMAP_LIMIT_LIMIT */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="font-mono text-xs font-medium">
                      HEATMAP_LIMIT_LIMIT
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>
                          Controls how many times a car can loop in the same
                          area before the algorithm cuts that branch. Higher
                          values allow more complex solutions but increase
                          computation time. Only increase if you know a car must
                          loop more than{" "}
                          {defaultHyperparams().heatmap_limit_limit} times.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {hyperparameters.heatmap_limit_limit}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setHyperparams(defaultHyperparams().heatmap_limit_limit)
                    }
                    className="h-6 px-2 text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>
                      Default: {defaultHyperparams().heatmap_limit_limit}
                    </span>
                    <span>30</span>
                  </div>
                  <Slider
                    value={[hyperparameters.heatmap_limit_limit]}
                    onValueChange={(value) => setHyperparams(value[0])}
                    min={0}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <Separator className="my-2" />

              {/* DECOY_HEATMAP_LIMIT */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="font-mono text-xs font-medium">
                      DECOY_HEATMAP_LIMIT
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>
                          Controls how many times a decoy can loop before the
                          algorithm cuts that branch. Decoys often require more
                          loops than regular cars to reach their destinations.
                          Only increase if you know a decoy must loop more than{" "}
                          {defaultHyperparams().decoy_heatmap_limit} times.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {hyperparameters.decoy_heatmap_limit}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setHyperparams(
                        undefined,
                        defaultHyperparams().decoy_heatmap_limit
                      )
                    }
                    className="h-6 px-2 text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>
                      Default: {defaultHyperparams().decoy_heatmap_limit}
                    </span>
                    <span>30</span>
                  </div>
                  <Slider
                    value={[hyperparameters.decoy_heatmap_limit]}
                    onValueChange={(value) =>
                      setHyperparams(undefined, value[0])
                    }
                    min={0}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <Separator className="my-2" />

              {/* GEN_TYPE */}
              <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="font-mono text-xs font-medium">
                      GEN_TYPE
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>
                          Determines the search strategy: DFS explores deeper
                          paths first (faster but may miss optimal solutions),
                          while BFS explores all possibilities at each depth
                          level (slower but finds optimal solutions).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {hyperparameters.gen_type}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setHyperparams(
                        undefined,
                        undefined,
                        defaultHyperparams().gen_type
                      )
                    }
                    className="h-6 px-2 text-xs"
                  >
                    Reset
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={
                      hyperparameters.gen_type === "DFS" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setHyperparams(undefined, undefined, "DFS")}
                    className="flex-1 h-8 text-xs"
                  >
                    DFS
                  </Button>
                  <Button
                    variant={
                      hyperparameters.gen_type === "BFS" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setHyperparams(undefined, undefined, "BFS")}
                    className="flex-1 h-8 text-xs"
                  >
                    BFS
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
