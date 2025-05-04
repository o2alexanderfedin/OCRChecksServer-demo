# Problem-Solving Framework for Integration Challenges

## Recognizing Integration Patterns

When systems fail to work together, three common patterns emerge:

1. **Platform Disparities**: What works in one environment fails in another
2. **Interface Mismatches**: Systems expect different data formats or conventions 
3. **Invisible Failures**: Problems occur without clear error messages

## Effective Problem-Solving Approach

### Phase 1: Systematic Investigation

When faced with integration issues:

1. **Add Comprehensive Instrumentation**
   - Log both inputs and outputs at every system boundary
   - Capture timing information for performance analysis
   - Use correlation IDs to track requests across components

2. **Isolate Variables**
   - Test components individually to identify failure points
   - Create minimal reproduction cases that remove unrelated complexity
   - Compare working and non-working scenarios methodically

3. **Examine Boundaries Closely**
   - Focus on data transformations between systems
   - Verify assumptions about expected formats and protocols
   - Compare exact data representations, not just logical equivalence

### Phase 2: Solution Development

After identifying root causes:

1. **Research Existing Solutions First**
   - Search for established libraries addressing similar problems
   - Review community resources and documentation
   - Look for platform-specific best practices

2. **Evaluate Build vs. Borrow Decision**
   - Custom solution factors:
     - Uniqueness of the problem
     - Performance requirements
     - Long-term maintenance costs
   - Third-party solution factors:
     - Maturity and stability
     - Active maintenance
     - Compatibility with your architecture

3. **If Building Custom Solutions**
   - Create narrowly focused components
   - Design for testability across all target environments
   - Document assumptions and constraints clearly

4. **If Using Existing Solutions**
   - Verify behavior in your specific contexts
   - Create thin adaptation layers if needed
   - Contribute improvements back when possible

### Phase 3: Implementation and Verification

Once a solution approach is selected:

1. **Implement Systematically**
   - Create consistent patterns across similar integration points
   - Build general utilities rather than one-off fixes
   - Centralize environment-specific adaptations

2. **Test Across All Environments**
   - Verify behavior in development, staging, and production contexts
   - Test with realistic data volumes and patterns
   - Simulate error conditions and edge cases

3. **Document the Journey**
   - Record root causes and solution approaches
   - Document lessons learned for future reference
   - Create runbooks for handling similar issues

## Learning From Failures: The Path to Robust Solutions

### Common Anti-Patterns to Avoid

1. **Premature Custom Implementation**
   - Building custom solutions before researching existing options
   - Underestimating the complexity of seemingly simple problems
   - Failing to consider maintenance costs

2. **Isolated Fixes**
   - Addressing symptoms rather than root causes
   - Creating one-off solutions to recurring patterns
   - Fixing problems without understanding why they occurred

3. **Insufficient Observability**
   - Deploying integration points without adequate logging
   - Failing to preserve context across system boundaries
   - Using generic error handling that loses critical details

### Framework for Better Integration Decisions

1. **Research → Prototype → Implement**
   - Begin with thorough research of existing solutions
   - Create minimal prototypes to verify approach
   - Implement systematic solutions based on verified patterns

2. **Specific → General → Reusable**
   - Start by solving the specific problem at hand
   - Identify general patterns that may recur
   - Create reusable components for consistent handling

3. **Observe → Adapt → Document**
   - Monitor solution behavior in all environments
   - Adapt approach based on real-world performance
   - Document both successes and failures for future reference

## Key Principles

1. **Don't Reinvent Foundational Components**
   - Core infrastructure concerns have usually been solved before
   - Leverage collective wisdom through established libraries
   - Focus your innovation on your unique business problems

2. **Design for Environmental Differences**
   - Assume behavior will vary across environments
   - Create abstractions that normalize these differences
   - Test in production-like settings early and often

3. **Build Systematic Observability**
   - Instrument all integration points from the beginning
   - Standardize error handling and logging patterns
   - Preserve context across system boundaries

## Changelog
- 2025-05-04: Initial framework documentation