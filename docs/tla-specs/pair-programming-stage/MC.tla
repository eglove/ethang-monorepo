------------------------------- MODULE MC -------------------------------
\* Model checking module — provides concrete constant values

EXTENDS PairProgrammingStage, TLC

CONSTANTS t1, t2, t3

MCTierOf == (t1 :> 1 @@ t2 :> 1 @@ t3 :> 2)

=============================================================================
