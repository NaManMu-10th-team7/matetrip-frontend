export interface WorkspaceResDto {
  id: string;
  workspaceName: string;
}

export interface PlanDayDto {
  id: string;
}

export interface CreateWorkspaceResponse {
  planDayDtos: PlanDayDto[];
  workspaceResDto: WorkspaceResDto;
}
